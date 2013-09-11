<cfcomponent>
	<cffunction name="createFiles" access="remote" output="false" returnFormat="JSON">
		<cfset var masterPath= expandPath("..")>
		<cfset var testJson= "">
		<cfset var rawJson= "">
		<cfset var errArray= []>
		<cfset var jsonResponse= {}>
		
		<cfif testJson NEQ "">
			<cfset rawJson = testJson />
		<cfelse>
			<cfset rawJson = ToString(GetHttpRequestData().content) />
		</cfif>
		
		<cfset var objectData= deserializeJson(rawJson)>
		<cfset var baseFileName= objectData.orm.name>
		
		<cffile action="write" file="#masterPath#/output/generatorLoadFiles/#baseFileName#_#DateFormat(Now(),'yyyymmdd')#_#TimeFormat(Now(),'HHmmss')#.json" output="#rawJson#" />
		
		<cfset errArray= createORMCFC(objectData.orm,masterPath,baseFileName,errArray)>
		<cfset errArray= createVTJSON(objectData.vt,masterPath,baseFileName,errArray)>
		
		<cfif arrayIsEmpty(errArray)>
			<cfset jsonResponse["outcome"]= "success">
		<cfelse>
			<cfset jsonResponse["outcome"]= "failure">
			<cfset jsonResponse["errors"]= errArray>
		</cfif>
		
		<cfreturn jsonResponse />
		
	</cffunction>
	
	<cffunction name="createVTJSON" access="public" output="false" returntype="array">
		<cfargument name="vtData" type="struct" required="true" />
		<cfargument name="filePath" type="string" required="true" />
		<cfargument name="fileName" type="string" required="true" />
		<cfargument name="errArray" type="array" required="true" />
		<cfset var objProps= []>
		<cfset var conditions= []>
		<cfset var contexts= []>
		<cfset var propAttrList= "name,desc,clientFieldName">
		<cfset var ruleAttrList= "type,contexts,failureMessage,condition">
		<cfset var vtFileContent= "">
		<cfset var c= "">
		<cfset var cparam= "">
		<cfset var ckey= "">
		<cfset var cArray= []>
		<cfset var p= "">
		<cfset var a= "">
		<cfset var r= "">
		<cfset var rp= "">
		
		<cftry>
		
			<cfscript>
				if(!StructIsEmpty(vtData.conditions)) {
					for(c in vtData.conditions) {
						cArray= [{"name"= c},{"serverTest"= vtData.conditions[c].serverTest}];
						if(vtData.conditions[c].clientTest != "") {
							ArrayAppend(cArray,{"clientTest"= vtData.conditions[c].clientTest});
						}
						if(vtData.conditions[c].desc != "") {
							ArrayAppend(cArray,{"desc"= vtData.conditions[c].desc});
						}
						ArrayAppend(conditions,cArray);
					}
				}
				
				if(!StructIsEmpty(vtData.contexts)) {
					for(c in vtData.contexts) {
						ArrayAppend(contexts,{"name"= c,"formName"= vtData.contexts[c].formName});
					}
				}
				
				for(p in vtData.props) {
					propStruct= {};
					propStruct["name"]= p;
					for(attr in vtData.props[p]) {
						if(attr != "rules") {
							propStruct[attr]= vtData.props[p][attr];
						} else {
							propStruct["rules"]= [];
							for(r= 1; r <= arrayLen(vtData.props[p].rules); r++) {
								currentRule= vtData.props[p].rules[r];
								ruleStruct= {};
								for(rattr in currentRule) {
									if(rattr== "contexts") {
										ruleStruct[rattr]= Replace(currentRule[rattr],", ",",","ALL");
									} else if(rattr== "params") {
										ruleStruct["params"]= currentRule["params"];
									} else {
										ruleStruct[rattr]= currentRule[rattr];
									}
								}
								
								arrayAppend(propStruct["rules"],ruleStruct);
							}
						}
					}
					
					arrayAppend(objProps,propStruct);
				}
			</cfscript>
		<cfsetting enablecfoutputonly="true">

<cfsavecontent variable="vtFileContent"><cfoutput>{"validateThis" : {</cfoutput>
<cfif Not ArrayIsEmpty(conditions)><cfoutput>
	"conditions" : [</cfoutput><cfloop index="c" from="1" to="#ArrayLen(conditions)#"><cfoutput>
		{</cfoutput><cfloop index="cparam" from="1" to="#ArrayLen(conditions[c])#">
			<cfloop item="ckey" collection="#conditions[c][cparam]#"><cfoutput>
				"#ckey#": "#Replace(conditions[c][cparam][ckey],'"','\"','ALL')#"</cfoutput>
			</cfloop><cfif cparam NEQ ArrayLen(conditions[c])><cfoutput>,</cfoutput></cfif>
		</cfloop><cfoutput>
		}</cfoutput><cfif c NEQ ArrayLen(conditions)><cfoutput>,</cfoutput></cfif></cfloop><cfoutput>
	],</cfoutput>
</cfif>

<cfif Not ArrayIsEmpty(contexts)><cfoutput>
	"contexts" : [</cfoutput><cfloop index="c" from="1" to="#ArrayLen(contexts)#"><cfoutput>
		{"name": "#contexts[c].name#", "formName": "#contexts[c].formName#"}</cfoutput><cfif c NEQ ArrayLen(contexts)><cfoutput>,</cfoutput></cfif></cfloop><cfoutput>
	],</cfoutput>
</cfif><cfoutput>
	
	"objectProperties" : [</cfoutput><cfloop index="p" from="1" to="#arrayLen(objProps)#"><cfoutput>
		{</cfoutput>
			<cfloop index="a" list="#propAttrList#">
				<cfif StructKeyExists(objProps[p],a) AND objProps[p][a] NEQ ""><cfoutput>
				"#a#": "#Replace(objProps[p][a],'"',"''",'ALL')#",</cfoutput>
				</cfif>
			</cfloop><cfoutput>
				"rules": [</cfoutput>
				<cfloop index="r" from="1" to="#arrayLen(objProps[p].rules)#"><cfoutput>
					{</cfoutput><cfloop index="a" list="#ruleAttrList#"><cfif StructKeyExists(objProps[p].rules[r],a) AND objProps[p].rules[r][a] NEQ ""><cfif a NEQ "type"><cfoutput>,</cfoutput></cfif><cfoutput>
						"#a#": "#Replace(objProps[p].rules[r][a],'"',"''",'ALL')#"</cfoutput></cfif></cfloop><cfif StructKeyExists(objProps[p].rules[r],"params")><cfoutput>,
						"params": [</cfoutput>
						<cfloop index="rp" from="1" to="#arrayLen(objProps[p].rules[r].params)#"><cfoutput>
							{"name": "#objProps[p].rules[r].params[rp].name#", "value": "#Replace(objProps[p].rules[r].params[rp].value,'"',"''",'ALL')#"}<cfif rp NEQ arrayLen(objProps[p].rules[r].params)>,</cfif></cfoutput>
							</cfloop><cfoutput>
						]</cfoutput></cfif><cfoutput>
					}<cfif r NEQ arrayLen(objProps[p].rules)>,</cfif></cfoutput></cfloop><cfoutput>
				]
		}<cfif p NEQ arrayLen(objProps)>,</cfif></cfoutput></cfloop><cfoutput>
	]
}}	
</cfoutput>
</cfsavecontent>	
	
			<cfcatch type="any">
				<cfset errMsg= "Error processing ValidateThis data: " & cfcatch.message & " (" & cfcatch.tagContext[ArrayLen(cfcatch.tagContext)].Template & " - line " & cfcatch.tagContext[ArrayLen(cfcatch.tagContext)].line & ")">
				<cfset arrayAppend(arguments.errArray,errMsg)>
			</cfcatch>

		</cftry>
	
		<cfif arrayIsEmpty(arguments.errArray)>
			<cftry>
				<cffile action="write" file="#arguments.filePath#/output/vtFiles/#Lcase(arguments.fileName)#.json" output="#vtFileContent#" />
				<cfcatch type="any">
					<cfset errMsg= "Error creating ValidateThis file: " & cfcatch.message & " (" & cfcatch.tagContext[ArrayLen(cfcatch.tagContext)].Template & " - line " & cfcatch.tagContext[ArrayLen(cfcatch.tagContext)].line & ")">
					<cfset arrayAppend(arguments.errArray,errMsg)>
				</cfcatch>
			</cftry>
		</cfif>
	
		<cfreturn arguments.errArray />
	
	</cffunction>
	
	
	
	<cffunction name="createORMCFC" access="public" output="false" returntype="array">
		<cfargument name="ormData" type="struct" required="true" />
		<cfargument name="filePath" type="string" required="true" />
		<cfargument name="fileName" type="string" required="true" />
		<cfargument name="errArray" type="array" required="true" />
		
		<cfsetting enablecfoutputonly="true">
		<cfset var ormFileContent= "">
		<cfset var idPropertyStatement= 'property name="id" fieldtype="id"'>
		<cfset var key= "">
		<cfset var paramPair= "">
		<cfset var propStatement= "">
		<cfset var propStruct= {}>
		<cfset var paramKey= "">
		<cfset var errStruct= {}>
		
		<cftry>
		
<cfsavecontent variable="ormFileContent"><cfoutput>component persistent="true" table="#ormData.table#"
{
</cfoutput>
	<cfset idPropertyStatement= 'property fieldtype="id"'>
	<cfloop item="key" collection="#ormData.id#">
		<cfif key EQ "generator">
			<cfif ormData.id[key] NEQ "--NONE--">
				<cfset paramPair= 'generator="#ormData.id[key]#"'>
				<cfset idPropertyStatement= ListAppend(idPropertyStatement,paramPair," ")>
			</cfif>
		<cfelse>
			<cfif ormData.id[key] NEQ "">
				<cfset paramPair= '#key#="#processORMParam(ormData.id[key])#"'>
				<cfset idPropertyStatement= ListAppend(idPropertyStatement,paramPair," ")>
			</cfif>
		</cfif>
	</cfloop>
<cfoutput>	#idPropertyStatement#; 

</cfoutput>
	<cfloop item="key" collection="#ormData.properties#">
		<cfset propStatement= 'property name="#key#"'>
		<cfset propStruct= ormData.properties[key]>
		<cfloop item="paramKey" collection="#propStruct#">
			<cfset paramPair= '#paramKey#="#processORMParam(propStruct[paramKey].value)#"'>
			<cfset propStatement= ListAppend(propStatement,paramPair," ")>
		</cfloop>
<cfoutput>	#propStatement#;
</cfoutput>		
	</cfloop>
<cfoutput>}
</cfoutput></cfsavecontent>	
			<cfcatch type="any">
				<cfset errMsg= "Error processing ORM CFC data: " & cfcatch.message & " (" & cfcatch.tagContext[ArrayLen(cfcatch.tagContext)].Template & " - line " & cfcatch.tagContext[ArrayLen(cfcatch.tagContext)].line & ")">
			</cfcatch>
		</cftry>
		
		<cfif arrayIsEmpty(errArray)>
			<cftry>
				<cffile action="write" file="#arguments.filePath#/output/ormFiles/#arguments.fileName#.cfc" output="#ormFileContent#" />
				<cfcatch type="any">
					<cfset errMsg= "Error creating ORM CFC file: " & cfcatch.message & " (" & cfcatch.tagContext[ArrayLen(cfcatch.tagContext)].Template & " - line " & cfcatch.tagContext[ArrayLen(cfcatch.tagContext)].line & ")">
					<cfset arrayAppend(arguments.errArray,errMsg)>
				</cfcatch>
			</cftry>
		</cfif>
		
		<cfreturn arguments.errArray />
		
	</cffunction>
	
	<cffunction name="processORMParam" access="private" output="false" returntype="string">
		<cfargument name="paramVal" type="any" required="true" />
		<cfset var processedParam= arguments.paramVal>
		<cfif arguments.paramVal EQ "NO">
			<cfset processedParam= false>
		<cfelseif arguments.paramVal EQ "YES">
			<cfset processedParam= true>
		</cfif>
		<cfreturn processedParam />
	</cffunction>
	
	
</cfcomponent>