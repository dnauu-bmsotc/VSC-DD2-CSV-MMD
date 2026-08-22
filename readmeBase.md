# CSV Extension for Darkest Dungeon 2

Syntax highlighting and validation for Darkest Dungeon 2 CSV files.

## Extension Features

- Syntax highlighting for DD2 CSV files.
- Validation of values.
- Validation data can be modified in the extension installation folder.

## DD2 CSV Data Overview

Darkest Dungeon 2's CSV data has a lot of nuances. At the surface level it is stored in .csv files and is parsed as such. There are no embedded commas, all of them act as separators.

CSV data can be separated into multiple files, but it is not necessary. They should be placed on the top level of the mod folder or in the Overrides folder. CSV files in custom folders are not parsed by the game. Filenames should end with `.Group.csv` otherwise the game will skip them.

- Element IDs are not unique. Sometimes it is unclear what an element ID refers to. For example, all `Buff` elements share their IDs with their `ActorDataStatsElements`.
- Neither unique are combinations of element types with element IDs. For example, `LootTables` and `ActorDataEffects` elements are additive, there can be multiple `LootTable` elements with the same ID. There are some other additive elements.
- Fields in elements can repeat. For example, `sub_stat`.
- Some fields are position-sensitive. For example, `add_stats` and `multiply_stats` fields can be written right after a `key_map` field only.
- Some fields accept data of various nature. For example, `sub_stat` field accepts an integer, then a tag string, then repeats.
- `KingdomMap` is an odd element type that has no named fields.
- Some fields accept different types of values depending on other fields, for example, `m_ConditionString` can accept a tag or an `Item` ID depending on the `m_ConditionType`.
- Some fields specify data outside CSV files, for example localization indexes, directories, audio-related information.
- Conditions can be combined using `+`. For example, `is_confessions+has_0_stagecoach_wheels`. But `+` can also be used in IDs, for example, `quirk_dare_devil_dmg_+10pct` Buff. `+` as an operator is used in `KingdomMap`, `Condition`, `LootTable`, `BattleConfigurationTable`, `InnTable` elements.
- `m_ConditionString` fields can use `+` too. For example, `m_ConditionString,resistance+bleed,`. The first value needs to be an actor stat, the second needs to be a substat.
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
	- Indexes are defined in element's shells, it looks like a field cannot define an ID.
	- Tags are defined in fields.
	- Substats. I don't know how these work. It looks like they are not arbitrary. For example adding ```sub_stat,resistance,stun2,0.2,``` to a hero's `ActorDataStats` breaks the mod.

This extension tries to describe all this data in a formal way. Outer structure of elements is considered fixed, structure of field valuess is described in this way:
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