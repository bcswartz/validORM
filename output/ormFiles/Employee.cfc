component persistent="true" table="employees"
{
	property fieldtype="id" generator="native" name="id" ormType="integer" setter="false" column="employeeId"; 

	property name="firstName" ormtype="text" length="100";
	property name="startDate" ormtype="date";
	property name="age" ormtype="integer";
	property name="email";
	property name="lastName" length="100";
}

