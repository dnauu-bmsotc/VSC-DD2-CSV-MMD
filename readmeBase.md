# CSV Extension for Darkest Dungeon 2

Syntax highlighting and validation for Darkest Dungeon 2 CSV files.

## Extension Features

- Syntax highlighting for DD2 CSV files.
- Validation of elements, fields, and values.
- Hints on hover for fields and values.
- Autocomplete.

![Image: missing id](./images/screenshot_missing_id.png)
*Missing tag definition*

![Image: table hint](./images/screenshot_table.png)
*Table view for TableElements*

## DD2 CSV Data Overview

Darkest Dungeon 2's CSV data is nuanced. At the surface level it is stored in .csv files and they are parsed as such. There are no embedded commas, they all are separators. CSV filenames should end with `.Group.csv` otherwise the game will skip them.

Unless mod data is supposed override original data (I don't know much about overrides), mod's .csv files should be placed on the top level of the mod folder. The choice of dividing data into separate files or putting everything in one file is arbitrary. All files are parsed independently a into one data pool each time a game save file is loaded.

A DD2 CSV file's data consists of blocks called elements. Each element has an ID (not necessarily unique), and a type. A typical element looks like this:
```csv
element_start,hwm_point_blank_shot,ActorDataEffects
target_effects,move_knockback_1,prime_combo,
performer_effects,move_backward_1,
element_end
```
`hwm_point_blank_shot` is its ID, `ActorDataEffects` is its type. `element_start` and `element_end` mark element's boundary. An element can provide some data to the game. The kind of data that can be provided depends on element's type. Element's data consists of fields with values. One field with its values takes one line (with one exception). Field's name is the part of the line before the first comma. Field's values follow after.

`ActorDataEffects` is one of the types of elements that provide gameplay effects for entities. This example element tells the game that some entity can knockback, apply combo, and move the performer backward. The `target_effects` field tells what effects will be applied to target. This field accepts other element IDs as values. `move_knockback_1`, `prime_combo`, and `move_backward_1` are IDs of other elements:

```csv
element_start,move_knockback_1,Effect
m_Chance,1,
m_Move,1,
element_end

element_start,prime_combo,Effect
m_Chance,1,
m_TokenAddId,combo,
m_TokenAddAmount,1,
m_ShowValue,False,
element_end

element_start,move_backward_1,Effect
m_Chance,1,
m_IgnoreResist,True,
m_Move,1,
element_end
```

To tell what entity will have these effects, `hwm_point_blank_shot` needs to be connected to that entity. If `Effect` elements are connected to the `hwm_point_blank_shot` element through the `target_effects`, the `hwm_point_blank_shot` element is connected to a `ActorDataSkill` element via a shared ID:

```csv
lement_start,hwm_point_blank_shot,ActorDataSkill
m_IsFriendly,False,
launch_ranks,1,
target_ranks,1,
...
element_end

element_start,hwm_point_blank_shot,ActorDataStats
key_map,health_damage,health_damage_range,crit_chance,
add_stats,6,4,0.1,
element_end

element_start,hwm_point_blank_shot,ActorDataEffects
...
element_end
```

So the example `ActorDataEffects` element defines what effects the Point Blank Shot skill has. This skill also needs to be connected, but the connection between actors and skills (except path skills) is defined outside CSV data, in compiled game files.

More details:
- Element IDs are not unique, and neither unique are pairs of IDs with types. For example, `LootTables` elements are additive, there can be multiple `LootTable` elements with the same ID. Not all elements have this behavior, but loot table elements are not the only ones.
- Fields in elements can repeat. For example, `sub_stat` field can be repeated multiple times to add multiple substats.
- Some fields are position-sensitive. For example, `add_stats` and `multiply_stats` fields can be written right after a `key_map` field only.
- Some fields accept data of various nature. For example, `m_RankTags` field accepts an integer, then a tag string, then repeats.
- `KingdomMap` is an odd element type that has no named fields.
- Some fields accept different types of values depending on other fields, for example, `m_ConditionString` can accept a tag or an `Item` ID depending on the value of the `m_ConditionType` field in the same element.
- Some fields specify data outside CSV files, like localization indexes, directories, audio-related information.
- In some places values can be combined using `+` symbol. It looks like this is allowed only in these situations:
	- Table entries (`LootTable`, `BattleConfigurationTable`, `InnTable`): conditions can be combined using `+` symbol. For example, `is_confessions+has_0_stagecoach_wheels`. Outside table condition entries the `+` symbol is treated as a regular character, for example, in the `quirk_dare_devil_dmg_+10pct` buff.
	- `m_ConditionString` fields can use `+` too. For example, `m_ConditionString,resistance+bleed`. The first value needs to be an actor stat, the second needs to be a substat.
- Some CSV parts are case-sensitive. IDs, tags, and field names are case-sensitive. Keywords like `resistance` in `sub_stat,resistance,stun,0.1,` or `TOKEN_ADD` in `m_IgnoredSkillAttributeTypes` are not case-sensitive.
- `m_ConditionString` field uses `null` keyword as input. `m_DeathChainLootIds` field uses `none` keyword as input.
- Some fields that depend on other fields can have empty strings as valid values. For example:
	```csv
	element_start,swine_mashes_resist_kingdoms,BattleConfigurationTable
	m_chances,1,3,
	m_ids,swine_mashes_normal_kingdoms,swine_mashes_hard_kingdoms,
	m_types,sub_table,sub_table,
	m_tags,
	m_conditions,,escalation_is_over_1,
	element_end
	```
	Here `m_conditions` sets a condition for the `swine_mashes_hard_kingdoms` subtable to be a valid result. `m_chances` has to have values for each entry.
- Arbitrary values can be defined in some places, and in some places they are referenced.
	- IDs are defined in next to `element_start`. It seems that fields do not define IDs.
	- Tags are defined in fields.
	- Substats. I don't know how these work. It looks like they are not arbitrary. For example, adding ```sub_stat,resistance,stun2,0.2,``` to a hero's `ActorDataStats` breaks the mod.

This extension tries to describe all this data in a formal way. Outer structure of elements (`element_begin`, `ID`, `type`, `element_end`) is considered fixed, structure of field inputs is described in this way:
- `any` -- external information like localization, directories. Also used for fields of unknown nature. These fields are not validated.
- `float` -- single decimal value, for example `m_Chance,0.05`.
- `int` -- single integer value, for example `m_Size,1`.
- `bool` -- single boolean value, either `True` or `False`.
- `range` -- a range of integer values, for example `m_qtys,[1-2]`.
- `X ID` -- ID of existing element of type `X`.
- `X KW` -- a hardcoded value from a list of values `X`, for example `m_DurationType,round_end`.
- `X Tag+` -- an arbitrary tag of group `X`, for example `m_Tags,debuff` in `Buff` definitions.
- `X Tag-` -- an existing tag, for example `m_BuffRemoveAllTags,debuff` in `Effect` definitions.
- `List(T)` -- a list of values of the same type `T`, for example `List(Effect ID)` is satisfied by `target_effects,add_1_torso_target,end_combo,`. Lists can have empty values like `m_conditions,,is_kingdoms,,`.
- `Seq(T1,T2,T3,...)` -- a sequence of values of certain types. First value has to have `T1` type, second value has to have `T2` type, and so on. For example, `Seq(Cost ID,float,float)` is satisfied by `cost,char_cosmetics_price_1,0,0.167`.
- `Or(T1,T2,T3,...)` -- a single value of one of the specified types. For example, `List(Or(int,range))` is satisfied by `m_qtys,1,[12-24],20`.
- `Dep(X)` -- a field that uses different types of values depending on the `X` field from the same element. For example, `m_ConditionString` can accept a `Token` tag, `ActorDataClass` ID, `Unlock ID` etc. depending on the value of the `m_ConditionType` field.
	- If `X` field uses a list of values, then the dependent field needs to compare its values to `X`'s values in order. For example, `m_types,item,sub_table,` in a `LootTable` element binds `m_ids` field to have an `Item` ID first, and then a `LootTable` ID second, like `m_ids,quest_beastmen_ambulance_designation,HERO_POINT`.
- `Dep*(X)` -- the same as `Dep(X)` but requires all values to be provided. For example, in `LootTable` elements, `m_conditions` field can have empty values, like `m_conditions,,is_kingdoms,,,,`. But `m_chances` in the same element needs to provide a number for each entry.
- `nothing` is used for unused fields, like `m_profileLevel` field.
- `Sub(X KW,A,float)` is used for substats. The first value is a stat group. The second value is the substat.
- `PSV(X)` -- values separated by `+`.
