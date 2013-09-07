angular.module('OrmVT', []).
	config(['$routeProvider', function($routeProvider) {
		$routeProvider.
			when('/menu', {templateUrl: 'views/menu.html', controller: MenuOptions}).
			when('/new', {templateUrl: 'views/tool.html', controller: FileGen}).
			when('/load/:file', {templateUrl: 'views/tool.html', controller: FileGen}).
			otherwise({redirectTo: '/menu'})
		}]);	

function MenuOptions($scope, $routeParams, $http) {
	$scope.ngMenuOpen= {};
	
	$http.post('cfml/GenerateInputFiles.cfc?method=listFiles&returnformat=json').success(function(data) {
		$scope.fileCollection= data;
		for(var f= 0; f < $scope.fileCollection.length; f++) {
			$scope.ngMenuOpen[$scope.fileCollection[f].name]= false;
		}
	 });
	
	$scope.toggleMenuOpen= function(key) {
		if($scope.ngMenuOpen[key]) {
			 $scope.ngMenuOpen[key]= false;
		 } else if($scope.ngMenuOpen[key]== null) {
			 $scope.ngMenuOpen[key]= true;
		 } else {
			 $scope.ngMenuOpen[key]= true;
		 }
	 };
	
}

function FileGen($scope, $routeParams, $http, $location) {
   	
/*** Begin init functions ***/
	
	$scope.dataTransmitting= false;
	$scope.dataResponse= {};
	$scope.dataResponse.outcome= "notRun";
	$scope.dataResponse.errors= [];
	 
	$scope.tempData= {};
	$scope.tempData.propertyToAdd= '';
	$scope.tempData.conditionToAdd= '';
	$scope.tempData.contextToAdd= '';
	$scope.tempData.attrToAdd= "column";
	$scope.tempData.ruleToAdd= "boolean";
	
	$scope.boolOptions= [{"name": true}, {"name": false}];
	$scope.suggestedValidations= {};
	$scope.ngOpen= {
			"guide": false,
			"objectNameTable": true,
			"idProperty": false,
			"columnPropertiesAndValidations": false,
			"validationConditions": false,
			"validationContexts": false,
			"propertySet": {},
			"conditionSet": {},
			"contextSet": {},
			"ruleSet": {}
	};
	
	$http.get('data/ormtypes.json').success(function(data) {
		$scope.colOrmTypes = data;
	});
	 
	$http.get('data/columnPropertyAttributes.json').success(function(data) {
		$scope.colPropertyAttrs= data;
	});
	 
	$http.get('data/generatorOptions.json').success(function(data) {
		$scope.colGeneratorOptions= data;
	});
	 
	$http.get('data/ValidateThisRules.json').success(function(data) {
		$scope.colRules= data;
		$scope.runColRulesSuccess();
		$scope.startingObjectData($routeParams.file);
		
	});
	
	$scope.startingObjectData= function(loadFile) {
		if(loadFile!= undefined) {	
			$http.get('output/generatorLoadFiles/' + loadFile)
			.success(function(data) {
				$scope.orm= data.orm;
				$scope.vt= data.vt;
				$scope.loadFile= loadFile;
			})
			.error(function(data) {
				alert("The file '" + loadFile + "' either does not exist or did not load properly.");
			});
		} else {
			$http.get('data/blankORMData.json').success(function(data) {
				$scope.orm= data;
			});
			 
			$http.get('data/blankVTData.json').success(function(data) {
				$scope.vt= data;
			});
		}
		
	};	
	
	$scope.runColRulesSuccess= function() {
		for(var ruleType in $scope.colRules) {
			$scope.colRules[ruleType].optionalParamCount= 0;
			$scope.colRules[ruleType].optionalParamHint= "";
			$scope.colRules[ruleType].optionalParams= [];
				
			for(var param in $scope.colRules[ruleType].params) {
				if(!$scope.colRules[ruleType].params[param].required) {
					$scope.colRules[ruleType].optionalParamCount++;
					$scope.colRules[ruleType].params[param].name= param;
					$scope.colRules[ruleType].optionalParams.push($scope.colRules[ruleType].params[param]);
				}
			}
		};		 
	};

/*** End init functions ***/
/*** Begin property add/removal functions ***/	 

	$scope.addProperty= function(propName) {
		if($scope.orm.properties== null) {
			$scope.orm.properties= {};
		}
	
		$scope.orm.properties[propName]= {};
		
		$scope.updateSuggestedValidations($scope.orm.properties[propName], propName);
		$scope.toggleOpen(propName,'propertySet');
		$scope.tempData.propertyToAdd= '';
		
	 };
	 
	 $scope.deleteProperty= function(propName) {
		 delete $scope.orm.properties[propName];
		 delete $scope.vt[propName];
	 }; 
	 
/*** End property add/removal functions ***/	 
	 
/*** Begin validation condition add/removal functions ***/	 
	 $scope.addCondition= function(conditionName) {
		 if($scope.vt.conditions[conditionName]== null) {
			 $scope.vt.conditions[conditionName]= {};
			 $scope.vt.conditions[conditionName].serverTest= "";
			 $scope.vt.conditions[conditionName].clientTest= "";
			 $scope.vt.conditions[conditionName].desc= "";
			 $scope.toggleOpen(conditionName,'conditionSet');
			 $scope.tempData.conditionToAdd= '';
		 }
	 }
	 
	 $scope.deleteCondition= function(conditionName) {
		 delete $scope.vt.conditions[conditionName];
	 }
/*** End validation condition add/removal functions ***/
	 
/*** Begin validation context add/removal functions ***/	 
	 $scope.addContext= function(contextName) {
		 if($scope.vt.contexts[contextName]== null) {
			 $scope.vt.contexts[contextName]= {};
			 $scope.vt.contexts[contextName].formName= "";
			 $scope.toggleOpen(contextName,'contextSet');
			 $scope.tempData.contextToAdd= '';
		 }
	 }
	 
	 $scope.deleteContext= function(contextName) {
		 delete $scope.vt.contexts[contextName];
	 }
/*** End validation condition add/removal functions ***/
	 
	 
	 
/*** Begin property parameter add/removal functions ***/	 

	 $scope.addPropAttribute= function(propAttributes, attrToAdd, propName) { 
		 var key= attrToAdd.name;
		 if(propAttributes[key]== null) {
			 propAttributes[key]= {};
			 propAttributes[key].value= $scope.colPropertyAttrs[key].default;
		 } 
			
		 $scope.updateSuggestedValidations(propAttributes, propName);
		
	 };
	 
	 $scope.removePropAttribute= function(propAttributes, attributeName) {
		 delete propAttributes[attributeName];
	 };
	
/*** End property parameter add/removal functions ***/	 
/*** Begin validation add/removal functions ***/
	
	 $scope.addRule= function(ruleType,propName,paramValue) {
		 if($scope.vt.props[propName]== null) {
			 $scope.vt.props[propName]= {};
			 $scope.vt.props[propName].desc= propName;
			 $scope.vt.props[propName].clientfieldname= propName;
			 $scope.vt.props[propName].rules= [];
		 }
		
		 var newRule= {};
		 newRule.type= ruleType;
		 newRule.contexts= "*";
		 newRule.failureMessage= "";
		 newRule.condition= "";
		
		 for(var p in $scope.colRules[ruleType].params) {
			 if($scope.colRules[ruleType].params[p].required) {
				
				 if(newRule.params== null) {
					 newRule.params= [];
				 }
				
				 if(paramValue != undefined) {
					 var paramObj= {"name": p, "value": paramValue};
				 } else {
					 var paramObj= {"name": p, "value": ""};
				 }
				
				 newRule.params.push(paramObj);
			 }
		 }
		
		 if($scope.ngOpen.ruleSet[propName]== null) {
			 $scope.ngOpen.ruleSet[propName]= [];
		 }
		 
		 if($scope.vt.props[propName].rules.length== 0) {
			 $scope.vt.props[propName].rules.push(newRule);
			 $scope.ngOpen.ruleSet[propName][0]= true;
		 } else {
			 var inserted= false;
			 for(var r= 0; r < $scope.vt.props[propName].rules.length; r++) {
				 if($scope.vt.props[propName].rules[r].type > newRule.type) {
					 $scope.vt.props[propName].rules.splice(r,0,newRule);
					 $scope.ngOpen.ruleSet[propName][r]= true;
					 inserted= true;
					 break;
				 }
			 }
			 
			 if(inserted== false) {
				 $scope.vt.props[propName].rules.push(newRule);
				 $scope.ngOpen.ruleSet[propName][r]= true;
			 }
		 }
		 
	 };
	 
	 $scope.deleteRule= function(index,ruleType,vtRules,propName) {
		 var empty= true;
		 vtRules.splice(index,1);
		
		 if(vtRules.length== 0) {
			 delete $scope.vt.props[propName];
		 }
	 }
	 
	 $scope.addOptRuleParam= function(optParam,rule) {
		 if(rule.params== null) {
			 rule.params= [];
		 }
		 rule.params.push({"name": optParam,"value": ""});
	 };
	
	 $scope.deleteOptRuleParam= function(index,rule) {
		 rule.params.splice(index,1);
		 if(rule.params.length== 0) {
			 delete rule.params;
		 }
	 };
	
	 $scope.updateOptionalRuleParamHint= function(ruleType, ruleParam) {
		 $scope.colRules[ruleType].optionalParamHint= $scope.colRules[ruleType].params[ruleParam].hint;
	 };
	
/*** End validation add/removal functions ***/
	 
	 $scope.sendData= function() {
		 $scope.dataResponse.outcome= "notRun";
		 $scope.dataTransmitting= true;	
		 $scope.dataResponse.errors= [];
		
		 if($scope.orm.name== "" || $scope.orm.table== "") {
			 $scope.dataResponse.errors.push("You need to provide both a name for the ORM object and a table.");
		 }
		
		 if($scope.orm.properties== null) {
			 $scope.dataResponse.errors.push("You need to provide at least one property.");
		 }
		 
		 var ruleConditionArray= [];
		 var ruleConditionList= "";
		 var conditionArray= [];
		 var conditionList= "";
		 
		 var p;
		 var r;
		 var c;
		 
		 for(p in $scope.vt.props) {
			 for(r= 0; r < $scope.vt.props[p].rules.length; r++) {
				 if($scope.vt.props[p].rules[r].condition.length != 0) {
					 if(ruleConditionArray.indexOf($scope.vt.props[p].rules[r].condition)== -1) {
						 ruleConditionArray.push($scope.vt.props[p].rules[r].condition);
					 }
				 }
			 }
		 }
		 
		 if(ruleConditionArray.length > 0) {
			ruleConditionList= ruleConditionArray.sort().join();
			 for(c in $scope.vt.conditions) {
				 conditionArray.push(c);
			 }
			 
			 if(conditionArray.length== 0) {
				 $scope.dataResponse.errors.push("The conditions defined in the individual property rules (" + ruleConditionList + ") are not defined in the Validation Conditions block.");
			 } else {
				 conditionList= conditionArray.sort().join();
				 if(ruleConditionList != conditionList) {
					 $scope.dataResponse.errors.push("The conditions defined in the individual property rules (" + ruleConditionList + ")  do not match the conditions defined in the Validation Conditions block (" + conditionList + ").");
				 }
			 }
		 } else {
			 conditionArray= [];
			 for(c in $scope.vt.conditions) {
				 conditionArray.push(c);
			 }
			 if(conditionArray.length > 0) {
				conditionList= conditionArray.sort().join();
				 $scope.dataResponse.errors.push("You have conditions in the Validation Conditions block (" + conditionList + ") but no conditions defined in the individual property rules.");
			 }
		 }
		 
		 var contextArray= [];
		 var ruleContextArray= [];
		 var ruleContextString= "";
		 var missingRulesArray= [];
		 
		 for(c in $scope.vt.contexts) {
			 contextArray.push(c);
		 }
		  
		 if(contextArray.length > 0) {
			 for(p in $scope.vt.props) {
				 for(r= 0; r < $scope.vt.props[p].rules.length; r++) {
					 if($scope.vt.props[p].rules[r].contexts.length != 0 && $scope.vt.props[p].rules[r].contexts != "*") {
						 ruleContextArray.push($scope.vt.props[p].rules[r].contexts);
					 }
				 }
			 }
			 
			 if(ruleContextArray.length > 0) {
				 ruleContextString= ruleContextArray.join();
				 ruleContextArray= ruleContextString.split(",");
			 }
			
			 if(ruleContextArray.length== 0) {
				 $scope.dataResponse.errors.push("None of the contexts defined in the Validation Contexts block are present in any the individual property rules.");
			 } else {
				 for(c= 0; c < contextArray.length; c++) {
					 if(ruleContextArray.indexOf(contextArray[c])== -1) {
						 missingRulesArray.push(contextArray[c]);
					 }
				 }
				 
				 if(missingRulesArray.length > 0) {
					 $scope.dataResponse.errors.push("Some of the contexts defined in the Contexts block (" + missingRulesArray.join(", ") + ") are not present in any the individual property rules.");
				 }
			 }
			 
		 }
		 
	
		 if($scope.dataResponse.errors.length > 0) {
			 $scope.dataResponse.outcome= "failure";
			 $scope.dataResponse.errorStatement= "You need to fix the following issues before you can generate the files:";
			 $scope.dataTransmitting= false;	
		 } else {
			 var objectData= {
					 "orm": $scope.orm,
					 "vt": $scope.vt
			 };
			
			 $http.post('cfml/GenerateOutputFiles.cfc?method=createFiles&returnformat=json',objectData).success(function(data) {
				 $scope.dataTransmitting= false;	
				 $scope.dataResponse= data;
				 if($scope.dataResponse.outcome== "failure") {
					 $scope.dataResponse.errorStatement= "The following errors occurred when trying to generate the files:"
				 }
			 });
		 }	
	 };	
	 
	 $scope.hasNoAttributes= function(attributes) {
		 if(Object.keys(attributes).length <= 1) {
			 return true;
		 } else {
			 return false;
		 }
	 };
	
	 $scope.toggleOpen= function(key,context,index) {
		if(context== undefined) {
			if($scope.ngOpen[key]) {
				 $scope.ngOpen[key]= false;
			 } else if($scope.ngOpen[key]== null) {
				 $scope.ngOpen[key]= true;
			 } else {
				 $scope.ngOpen[key]= true;
			 }
		} else {
			if(index== undefined) {
				if($scope.ngOpen[context][key]) {
					 $scope.ngOpen[context][key]= false;
				 } else if($scope.ngOpen[context][key]== null) {
					 $scope.ngOpen[context][key]= true;
				 } else {
					 $scope.ngOpen[context][key]= true;
				 }
			} else {
				
				if($scope.ngOpen[context][key]== null) {
					$scope.ngOpen[context][key]= [];
				}
				
				if($scope.ngOpen[context][key][index]== null) {
					$scope.ngOpen[context][key][index]= true;
				} else if($scope.ngOpen[context][key][index]) {
					$scope.ngOpen[context][key][index]= false;
				} else {
					 $scope.ngOpen[context][key][index]= true;
				}
				
				
			}
			
		}
		
	 };
	 
	 $scope.toggleAll= function(context, state, property) {
		 var key;
		 var idx;
		 switch(context) {
		 	case "propertySet":
				 for(key in $scope.orm.properties) {
					$scope.ngOpen[context][key]= state;
				 }
				 break;
		 	case "conditionSet":
		 		for(key in $scope.vt.conditions) {
		 			$scope.ngOpen[context][key]= state;
		 		}
		 		break;
		 	case "contextSet": 
		 		for(key in $scope.vt.contexts) {
		 			$scope.ngOpen[context][key]= state;
		 		}
		 		break;
		 	case "ruleSet": 
		 		for(idx= 0; idx < $scope.vt.props[property].rules.length; idx++) {
		 			if($scope.ngOpen[context][property]== null) {
						$scope.ngOpen[context][property]= [];
					}
		 			$scope.ngOpen[context][property][idx]= state;
		 		}
		 		break;
		 }
	 };
		
	
	 $scope.updateSuggestedValidations= function(prop, propName) { 
		 if($scope.suggestedValidations[propName] != undefined) {
			 $scope.suggestedValidations[propName].length= 0;
		 } else {
			 $scope.suggestedValidations[propName]= [];
		 }
			
		 if(prop.ormtype== undefined) {
			 if(prop.length != null) {
				 $scope.suggestedValidations[propName].push(
						 {"name": "maxLength","value": prop.length.value}
				 );
			 }
		 } else { 
			 switch(prop.ormtype.value) {
			 	case "char":
				case "character":
				case "string":
				case "text":	
					if(prop.length != null) {
						$scope.suggestedValidations[propName].push(
								{"name": "maxLength","value": prop.length.value}
						);
					}	
				break;	
					
				case "boolean":
					$scope.suggestedValidations[propName].push(
							{"name": "boolean"}	
					);
				break;
					
				case "integer":
				case "int":
					$scope.suggestedValidations[propName].push(
							{"name":"integer"}
					);
				break;
						
				case "big_decimal":
				case "double":
				case "float":
				case "long":
				case "short":
					$scope.suggestedValidations[propName].push(
							{"name":"numeric"}	
					);
				break;
						
				case "date":
					$scope.suggestedValidations[propName].push(
							{"name":"date"}	
					);
				break;
						
			 }
		 }
			
		 switch(propName) {
		 	case "name":
		 	case "Name":
		 	case "firstName":
		 	case "FirstName":
		 	case "lastName":
		 	case "LastName":
		 		$scope.suggestedValidations[propName].push(
		 				{"name":"required"}	
		 		);
		 	break;
		 	
		 	case "email":
		 	case "Email":
		 		$scope.suggestedValidations[propName].push( 
		 				{"name":"email"}	
		 		);
		 	break;
				
		 	case "url":
		 	case "Url":
		 	case "URL":
		 		$scope.suggestedValidations[propName].push( 
		 				{"name":"url"}	
		 		);
		 	break;
		 }
			
	 };
	 
}


