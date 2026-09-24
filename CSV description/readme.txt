`CSV Elements.ods` stores the list of element types and comments to them.

`CSV Fields.ods` has multiple sheets, each sheet corresponds to one element type.
A sheet in this file contains field names, comments, and their input description in the
format described in the README.md in the root folder.

`CSV Values.ods` stores keywords and dependency information.
It has multiple sheets, one sheet corresponds to one keyword group.
The first column contains all possible values, other columns store information about how a specific keyword affects other fields.

For example, `CSV Fields.ods` describes *m_ConditionType*'s input in a *Condition* element as *ConditionType KW*.
The extension takes the word before "KW" (that is *ConditionType*) and searches the sheet with the same name in `CSV Values.ods`.
If this sheet does not have the provided value, the extension marks this value as an error.

Then, `CSV Fields.ods` describes *m_ConditionString* as `Dep(m_ConditionType)`
which means that its input depends on the value of the *m_ConditionType* field in the same element.
The extension searches `CSV Values.ods` for the "m_ConditionType" sheet and then searches
for the column named [element type + field name], in this example it's "Condition m_ConditionString".
This column describes what input should this field have depending on the value of another column.

Similar case are substat fields. For example, *ActorDataStats*' *sub_stat* field.
It's input is described as `Sub(ActorStatSubType KW,Substat,float)`.
The extension searches the "ActorStatSubType" sheet in `CSV Values.ods` and then
searches for the "Substat" column that has the required input description.
