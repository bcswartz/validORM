<cfcomponent>
	<cffunction name="listFiles" access="remote" returntype="string" output="false">
		<cfscript>
			var filePath= "#expandPath('..')#/output/generatorLoadFiles/";
			var qry1= DirectoryList(filePath,false,"query","","name asc");
			var qry2= QueryNew("objectName,dateString,timeString,fileName","VarChar,VarChar,VarChar,VarChar");
			var qry3= "";
			var returnArray= [];
			var fileStruct= {};
			var infoStruct= {};
			
			for(var r= 1; r <= qry1.recordcount; r++) {
				QueryAddRow(qry2,1);
				QuerySetCell(qry2,"fileName",qry1["name"][r]);
				QuerySetCell(qry2,"objectName",ListGetAt(qry1["name"][r],1,"_"));
				QuerySetCell(qry2,"dateString",ListGetAt(qry1["name"][r],2,"_"));
				QuerySetCell(qry2,"timeString",ListGetAt(ListGetAt(qry1["name"][r],3,"_"),1,"."));
			}
		
		</cfscript>
		
		<cfquery name="qry3" dbtype="query">
			select fileName, objectName, dateString, timeString
			from qry2
			order by objectName ASC, dateString DESC, timeString DESC
		</cfquery>
		
		<cfoutput query="qry3" group="objectName">
			<cfset fileStruct= {}>
			<cfset fileStruct["name"]= qry3.objectName>
			<cfset fileStruct["copies"]= []>
			<cfoutput>
				<cfset infoStruct= {}>
				<cfset infoStruct["dateString"]= DateFormat(CreateDate(Left(qry3.dateString,4),Mid(qry3.dateString,5,2),Right(qry3.dateString,2)),"mm/dd/yyyy")>
				<cfset infoStruct["timeString"]= TimeFormat(CreateTime(Left(qry3.timeString,2),Mid(qry3.timeString,3,2),Right(qry3.timeString,2)),"h:mm:ss tt")>
				<cfset infoStruct["queryString"]= qry3.fileName>
				<cfset ArrayAppend(fileStruct["copies"],infoStruct)>
			</cfoutput>
			<cfset ArrayAppend(returnArray,fileStruct) />
		</cfoutput>
		
		<cfreturn serializeJson(returnArray)>
	
	</cffunction>
	
</cfcomponent>

