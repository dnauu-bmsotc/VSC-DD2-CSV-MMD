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

# CSV data description


<details>
<summary><b>Achievement</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|m_allTags||||
|m_anyTags||||
|m_avoidTags||||
|m_destinationTags||||
|m_eachTags||||
|m_number|integer|||
|m_sourceTags||||
|m_targetFloat|float|||
|m_targetInt|integer|||
|m_type|keyword||keyword: <details><summary>expand</summary>actor_death, actor_death_combat_sum, actor_death_count_from_source, actor_death_inventory_full, actor_death_run_sum, actor_death_skill_use_active_tokens, actor_death_with_source, affinity_overstress, affinity_overstress_chain, altar_of_hope_total_progress, biome_complete, biome_complete_group, collected_trophies, combat_party_has_quirk, combat_skill_hits, combat_victory, confession_victory, confession_victory_consecutive, driving_distance, game_mode_transition, hire_mercenary, hospital_full_service, inn_treasure_campaign_sum, inn_visit_all, inventory_full, inventory_item_add, inventory_item_purchase, item_triggered_effects, kingdom_campaign_use_items, kingdom_inn_capstones, kingdom_kill_contracts, kingdom_victory, kingdom_victory_uninfected_heroes, node_deliverable_campaign_sum, party_classes, party_relationship_pair, party_relationships, party_wipe, profile_unlock, profile_unlock_group, quest_complete, quest_step_story_choices, release_anniversary, replacement_hero_add, roster_confirm, roster_relationships_unique, run_end, skill_health_damage, skill_mastery, skill_use, skill_use_processed_tokens, tokens_removed_campaign_sum</details><br>|
</details>

<details>
<summary><b>ActOut</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|all_conditions|List(Condition&nbsp;ID)|Conjunctive conditioning. If any of the conditions specified in this field aren’t met, there will be no roll for this act out.||
|any_conditions|List(Condition&nbsp;ID)|Disjunctive conditioning. If all of the conditions specified in this field aren’t met, there will be no roll for this act out.||
|effects|List(Effect&nbsp;ID)|||
|m_ActorType|keyword|if this act out is skill-related then this field only accepts PERORMER, TARGET, or SELF.|keyword: OTHER, PARTY, PERFORMER, SELF, TARGET<br>|
|m_AdditionalSkillTags|List(ActorDataSkill&nbsp;Tag-)|If m_Type is set to skill_aditional, this field is used to specify what skill to choose. If multiple tags are specified, it looks for a skill with any number of these tags. If multiple skills match this selector, only the first one is selected.||
|m_BarkSwapPerformerAndTarget|boolean|||
|m_Chance|float|Chance of triggering this act out if conditions are met.||
|m_DelayCooldownDurationAmount|integer|||
|m_DelayCooldownDurationType|keyword||keyword: combat_end, day, embark_end, embark_start, every_turn_end, every_turn_start, infinite, inn_end, inn_start, node, performer_turn_end, performer_turn_start, round_end, round_start, skill_calculate, skill_cooldown, token_calculate_damage<br>|
|m_DisplayType|keyword||keyword: crimson_curse_bloodlust, crimson_curse_craving, crimson_curse_passive, crimson_curse_wasting, negative, positive<br>|
|m_EffectSwapPerformerAndTarget|boolean|||
|m_IsFriendly|boolean|||
|m_IsGuardingValid|boolean|Default True||
|m_IsMultihitValid|boolean|Default True||
|m_IsZoomIn|boolean|Only act outs that have m_Type set to skill_after, skill_block, or start_turn can use this field.||
|m_Priority|integer|||
|m_RandomStartCooldownDurationAmount|integer|||
|m_RandomStartCooldownDurationType|keyword||keyword: combat_end, day, embark_end, embark_start, every_turn_end, every_turn_start, infinite, inn_end, inn_start, node, performer_turn_end, performer_turn_start, round_end, round_start, skill_calculate, skill_cooldown, token_calculate_damage<br>|
|m_SelectCooldownDurationAmount|integer|||
|m_SelectCooldownDurationType|keyword||keyword: combat_end, day, embark_end, embark_start, every_turn_end, every_turn_start, infinite, inn_end, inn_start, node, performer_turn_end, performer_turn_start, round_end, round_start, skill_calculate, skill_cooldown, token_calculate_damage<br>|
|m_SelectDelayTags||||
|m_SourceIdLimit|integer|||
|m_SourceTypeLimit|integer|||
|m_Tags|List(ActOut&nbsp;Tag+)|||
|m_Type|keyword||keyword: banter, rest_item_block, skill_additional, skill_after, skill_before, skill_block, start_turn, story_choice<br>|
</details>

<details>
<summary><b>ActorDataActOut</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|act_outs|List(ActOut&nbsp;ID)|||
</details>

<details>
<summary><b>ActorDataClass</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|m_ActorChangeClassHealType|keyword||keyword: MAX_HP, MAX_HP_DELTA<br>|
|m_ActorControllerType|keyword|RANDOM makes this actor to choose skills randomly. Move and wait actions count as skills too. This also supports INPUT which lets player to control what skill will be chosen.|keyword: INPUT, RANDOM, SEQUENTIAL_SKILL_TEST, TEST<br>|
|m_ClearContainerKeepTags|List(Or(Token&nbsp;Tag-, Buff&nbsp;Tag-, Buff&nbsp;Tag-, Dot&nbsp;Tag-))|||
|m_ClearContainerTypes|List(keyword)|If another actor was transformed into this actor, buffs/DOTs/tokens will be removed. This is important, for example, for the final Confession boss that uses hidden tokens to track if a hero is still alive.|keyword: BuffContainer, DebuffContainer, DotContainer, TokenContainer<br>|
|m_DeathBackActorClassIds|List(ActorDataClass&nbsp;ID)|||
|m_DeathChainIds|List(ActorDataClass&nbsp;ID)|If the actor referenced by this field dies, this actor dies too||
|m_DeathChainLootIds|List(Or(keyword, LootTable&nbsp;ID))||keyword: none<br>|
|m_DeathClassAddsTurn|boolean|||
|m_DeathClassRemovesTurns|boolean|Default True||
|m_DeathFrontActorClassIds|List(ActorDataClass&nbsp;ID)|||
|m_DeathLootIds|List(LootTable&nbsp;ID)|||
|m_DeathRound|integer|||
|m_DefaultActorDataPathId|ActorDataPath&nbsp;ID|||
|m_EquippedCombatSkillLimit|integer|It can be increased, but values above 6 lead to UI overlaps, at least on my screen.||
|m_ExpeditionUnlockId|Unlock&nbsp;ID|||
|m_IgnoredSkillAttributeTypes|List(keyword)|Disallows this actor to gain buffs/quirks/tokens|keyword: affinity_negative, affinity_positive, bark, buff_add, buff_remove, capture, dot_add, dot_copy, dot_remove, dot_steal, health_damage, health_heal, kill, move, quirk_add, quirk_remove, release, stress_damage, stress_heal, token_add, token_convert, token_copy, token_invert, token_remove, token_steal, wound_add, wound_remove<br>|
|m_IsActOutSkillAdditionalInvalidating|boolean|||
|m_IsActoutValid|boolean|||
|m_IsBarkTriggerValid|boolean|||
|m_IsBattleComplete|boolean|If set to True, then fights will finish even if this actor is alive||
|m_IsCombatHoverable|boolean|Default True||
|m_IsDeathPhase|boolean|||
|m_IsEffectsReasonValid|boolean|Default True||
|m_IsHealthless|boolean|||
|m_IsRelationshipValid|boolean|||
|m_IsStallCounted|boolean|||
|m_IsStallInvalidating|boolean|||
|m_IsStartRoundSkillsCounted|boolean|||
|m_IsStressTriggerValid|boolean|||
|m_IsTargetable|boolean|Default True||
|m_IsTickTriggerValid|boolean|||
|m_LocalizationGender||||
|m_NameOverrideId||||
|m_QuirkContainerId|QuirkContainer&nbsp;ID|A default roster_quirk_container can be swapped to make hero's starting quirks predefined.||
|m_RankTags|List(Seq(integer, Rank&nbsp;Tag+))|Example: `element_start,herostory_jes_combat_2_note_a_sq1,ActorDataClass m_RankTags,0,sweet_spot,2,sweet_spot,`||
|m_ReserveActorDataPathId|ActorDataPath&nbsp;ID|||
|m_ResistAlwaysIds|List(Resist&nbsp;ID)|||
|m_ResistMaxOverrides|List(Seq(Resist&nbsp;ID, float))|Caps specified resistances so they can't go above the given value||
|m_ResistMinOverrides|List(Seq(Resist&nbsp;ID, float))|Caps specified resistances so they can't go below the given value||
|m_RosterOrderPriority|integer|Specifies hero's order priority at the Crossroads. PD's priority is 19, Abomination's priority is 5.||
|m_Size|integer|||
|m_SkillBlockId|SkillBlock&nbsp;ID|||
|m_SpawnLootIds|List(LootTable&nbsp;ID)|||
|m_StartingRosterStatusType|keyword||keyword: captured, dead, hire, hire_replaced, idle, kingdom, load, party, reserve<br>|
|m_Tags|List(ActorDataClass&nbsp;Tag+)|brain_blessing tag indicates that this actor can become ordained in Act 1. Other blessings: lungs_blessing, eyes_blessing, arms_blessing, final_blessing||
|m_TokenViewValid|boolean|Default True||
|modes|List(ActorDataMode&nbsp;ID)|||
|overstresses|List(Overstress&nbsp;ID)|||
|skill_sets|List(SkillSet&nbsp;ID)|||
|summon_any_conditions|List(Condition&nbsp;ID)|||
</details>

<details>
<summary><b>ActorDataEffects</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|actor_effect_triggers|List(ActorEffectTrigger&nbsp;ID)|||
|change_class_effects|List(Effect&nbsp;ID)|||
|combat_end_effects|List(Effect&nbsp;ID)|||
|combat_health_damage_apply_limit|integer|||
|combat_health_damage_apply_limit_effects|List(Effect&nbsp;ID)|||
|combat_health_damage_effects|List(Effect&nbsp;ID)|||
|combat_health_damage_enemy_team_effects|List(Effect&nbsp;ID)|||
|combat_health_damage_friendly_team_effects|List(Effect&nbsp;ID)|||
|combat_health_heal_apply_limit|integer|||
|combat_health_heal_apply_limit_effects|List(Effect&nbsp;ID)|||
|combat_health_heal_effects|List(Effect&nbsp;ID)|||
|combat_health_heal_enemy_team_effects|List(Effect&nbsp;ID)|||
|combat_health_heal_friendly_team_effects|List(Effect&nbsp;ID)|||
|combat_health_heal_friendly_team_random_effects|List(Effect&nbsp;ID)|||
|combat_start_apply_limit|integer|||
|combat_start_apply_limit_effects|List(Effect&nbsp;ID)|||
|combat_start_effects|List(Effect&nbsp;ID)|||
|combat_stress_damage_apply_limit|integer|||
|combat_stress_damage_apply_limit_effects|List(Effect&nbsp;ID)|||
|combat_stress_damage_effects|List(Effect&nbsp;ID)|||
|combat_stress_damage_enemy_team_effects|List(Effect&nbsp;ID)|||
|combat_stress_damage_friendly_team_effects|List(Effect&nbsp;ID)|||
|combat_stress_heal_effects|List(Effect&nbsp;ID)|||
|combat_stress_heal_enemy_team_effects|List(Effect&nbsp;ID)|||
|combat_stress_heal_friendly_team_effects|List(Effect&nbsp;ID)|||
|death_effects|List(Effect&nbsp;ID)|||
|deaths_door_enter_effects|List(Effect&nbsp;ID)|||
|deaths_door_exit_effects|List(Effect&nbsp;ID)|||
|deaths_door_survive_effects|List(Effect&nbsp;ID)|||
|enemy_death_effects|List(Effect&nbsp;ID)|||
|enemy_death_team_effects|List(Effect&nbsp;ID)|||
|enemy_team_apply_limit|integer|||
|enemy_team_apply_limit_effects|List(Effect&nbsp;ID)|||
|enemy_team_effects|List(Effect&nbsp;ID)|||
|enemy_team_member_random_effects|List(Effect&nbsp;ID)|||
|enter_biome_effects|List(Effect&nbsp;ID)|||
|friendly_death_effects|List(Effect&nbsp;ID)|||
|friendly_death_team_effects|List(Effect&nbsp;ID)|||
|friendly_team_effects|List(Effect&nbsp;ID)|||
|inn_start_effects|List(Effect&nbsp;ID)|||
|kingdom_cleanse_effects|List(Effect&nbsp;ID)|||
|kingdom_contagion_effects|List(Effect&nbsp;ID)|||
|move_apply_limit|integer|||
|move_apply_limit_effects|List(Effect&nbsp;ID)|||
|move_effects|List(Effect&nbsp;ID)|||
|move_enemy_apply_limit|integer|||
|move_enemy_apply_limit_effects|List(Effect&nbsp;ID)|||
|move_enemy_effects|List(Effect&nbsp;ID)|||
|move_friendly_effects|List(Effect&nbsp;ID)|||
|node_before_effects|List(Effect&nbsp;ID)|||
|node_execute_started_effects|List(Effect&nbsp;ID)|||
|on_attack_as_performer_to_performer_effects|List(Effect&nbsp;ID)|||
|on_attack_as_performer_to_target_effects|List(Effect&nbsp;ID)|||
|on_attack_as_target_to_performer_apply_limit|integer|||
|on_attack_as_target_to_performer_apply_limit_effects|List(Effect&nbsp;ID)|||
|on_attack_as_target_to_performer_effects|List(Effect&nbsp;ID)|||
|on_attack_as_target_to_target_effects|List(Effect&nbsp;ID)|||
|on_crit_as_performer_to_performer_effects|List(Effect&nbsp;ID)|||
|on_crit_as_performer_to_target_effects|List(Effect&nbsp;ID)|||
|on_crit_as_target_to_performer_effects|List(Effect&nbsp;ID)|||
|on_crit_as_target_to_target_apply_limit|integer|||
|on_crit_as_target_to_target_apply_limit_effects|List(Effect&nbsp;ID)|||
|on_crit_as_target_to_target_effects|List(Effect&nbsp;ID)|||
|on_hit_as_performer_to_performer_apply_limit|integer|||
|on_hit_as_performer_to_performer_apply_limit_effects|List(Effect&nbsp;ID)|||
|on_hit_as_performer_to_performer_effects|List(Effect&nbsp;ID)|||
|on_hit_as_performer_to_target_apply_limit|integer|||
|on_hit_as_performer_to_target_apply_limit_effects|List(Effect&nbsp;ID)|||
|on_hit_as_performer_to_target_effects|List(Effect&nbsp;ID)|||
|on_hit_as_target_to_performer_apply_limit|integer|||
|on_hit_as_target_to_performer_apply_limit_effects|List(Effect&nbsp;ID)|||
|on_hit_as_target_to_performer_effects|List(Effect&nbsp;ID)|||
|on_hit_as_target_to_target_apply_limit|integer|||
|on_hit_as_target_to_target_apply_limit_effects|List(Effect&nbsp;ID)|||
|on_hit_as_target_to_target_effects|List(Effect&nbsp;ID)|||
|on_kill_as_performer_to_performer_effects|List(Effect&nbsp;ID)|||
|on_kill_as_target_to_performer_apply_limit|integer|||
|on_kill_as_target_to_performer_apply_limit_effects|List(Effect&nbsp;ID)|||
|on_kill_as_target_to_performer_effects|List(Effect&nbsp;ID)|||
|on_miss_as_performer_to_performer_effects|List(Effect&nbsp;ID)|||
|on_miss_as_performer_to_target_effects|List(Effect&nbsp;ID)|||
|on_miss_as_target_to_performer_effects|List(Effect&nbsp;ID)|||
|on_miss_as_target_to_target_effects|List(Effect&nbsp;ID)|||
|on_not_crit_as_performer_to_performer_effects|List(Effect&nbsp;ID)|||
|on_not_crit_as_performer_to_target_effects|List(Effect&nbsp;ID)|||
|on_overstress_effects|List(Effect&nbsp;ID)|||
|on_release_per_round_captured_effects|List(Effect&nbsp;ID)|||
|on_release_per_turn_captured_effects|List(Effect&nbsp;ID)|||
|performer_after_target_apply_limit|integer|||
|performer_after_target_apply_limit_effects|List(Effect&nbsp;ID)|||
|performer_after_target_effects|List(Effect&nbsp;ID)|||
|performer_apply_limit|integer|||
|performer_apply_limit_effects|List(Effect&nbsp;ID)|||
|performer_effects|List(Effect&nbsp;ID)|||
|performer_from_target_apply_limit|integer|||
|performer_from_target_apply_limit_effects|List(Effect&nbsp;ID)|||
|performer_from_target_effects|List(Effect&nbsp;ID)|||
|performer_neighbor_random_effects|List(Effect&nbsp;ID)|||
|performer_neighbors_effects|List(Effect&nbsp;ID)|||
|performer_on_crit_single_effects|List(Effect&nbsp;ID)|||
|performer_on_kill_fail_effects|List(Effect&nbsp;ID)|||
|performer_per_crit_effects|List(Effect&nbsp;ID)|||
|performer_per_target_effects|List(Effect&nbsp;ID)|||
|performer_team_effects|List(Effect&nbsp;ID)|||
|performer_team_others_apply_limit|integer|||
|performer_team_others_apply_limit_effects|List(Effect&nbsp;ID)|||
|performer_team_others_effects|List(Effect&nbsp;ID)|||
|performer_team_others_member_random_effects|List(Effect&nbsp;ID)|||
|respawn_effects|List(Effect&nbsp;ID)|||
|rest_item_effects|List(Effect&nbsp;ID)|||
|roster_status_exit_effects|List(Effect&nbsp;ID)|||
|round_end_effects|List(Effect&nbsp;ID)|||
|round_start_apply_limit|integer|||
|round_start_apply_limit_effects|List(Effect&nbsp;ID)|||
|round_start_effects|List(Effect&nbsp;ID)|||
|spawn_apply_limit|integer|||
|spawn_apply_limit_effects|List(Effect&nbsp;ID)|||
|spawn_effects|List(Effect&nbsp;ID)|||
|target_apply_limit|integer|||
|target_apply_limit_effects|List(Effect&nbsp;ID)|||
|target_effects|List(Effect&nbsp;ID)|||
|target_neighbor_random_effects|List(Effect&nbsp;ID)|||
|target_neighbors_apply_limit|integer|||
|target_neighbors_apply_limit_effects|List(Effect&nbsp;ID)|||
|target_neighbors_effects|List(Effect&nbsp;ID)|||
|target_team_effects|List(Effect&nbsp;ID)|||
|target_team_hit_member_random_effects|List(Effect&nbsp;ID)|||
|target_team_member_random_effects|List(Effect&nbsp;ID)|||
|target_team_others_effects|List(Effect&nbsp;ID)|||
|turn_end_apply_limit|integer|||
|turn_end_apply_limit_effects|List(Effect&nbsp;ID)|||
|turn_end_effects|List(Effect&nbsp;ID)|||
|turn_end_enemy_team_effects|List(Effect&nbsp;ID)|||
|turn_end_friendly_team_effects|List(Effect&nbsp;ID)|||
|turn_skip_effects|List(Effect&nbsp;ID)|||
|turn_start_apply_limit|integer|||
|turn_start_apply_limit_effects|List(Effect&nbsp;ID)|||
|turn_start_effects|List(Effect&nbsp;ID)|||
|turn_start_enemy_team_effects|List(Effect&nbsp;ID)|||
|turn_start_enemy_team_random_effects|List(Effect&nbsp;ID)|||
|turn_start_friendly_team_effects|List(Effect&nbsp;ID)|||
</details>

<details>
<summary><b>ActorDataExternalBuffs</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|buffs|List(Buff&nbsp;ID)|||
|instance_buffs|Seq(integer, List(Buff&nbsp;ID))|When an Infernal Flame or a trinket appears in game, it can acquire random buffs until the end of a run||
</details>

<details>
<summary><b>ActorDataMode</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|m_BarkOverrideKey||||
</details>

<details>
<summary><b>ActorDataPath</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|m_ActorClassIds|List(ActorDataClass&nbsp;ID)|||
|m_ActorClassTags|List(ActorDataClass&nbsp;Tag-)|||
|m_OrderPriority|integer|||
|m_Tags|List(ActorDataPath&nbsp;Tag+)|||
|m_UnlockId|Unlock&nbsp;ID|||
|m_ViewedByDefault|boolean|||
</details>

<details>
<summary><b>ActorDataRunGoals</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|run_goals|List(RunGoal&nbsp;ID)|||
</details>

<details>
<summary><b>ActorDataSkill</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|launch_ranks|List(integer)|Ranks on which this skill can be used. If the actor occupies several ranks, only the rank closest to the front counts.||
|m_ActorDataEffectsId|ActorDataEffects&nbsp;ID|||
|m_ActorDataModeId|ActorDataMode&nbsp;ID|||
|m_AdditionalDamageActorType|keyword||keyword: PERFORMER, PERFORMER_NEIGHBOR_BACK, PERFORMER_NEIGHBOR_FRONT, TARGET, TARGET_NEIGHBOR_BACK, TARGET_NEIGHBOR_FRONT<br>|
|m_AdditionalDamageValueMultiplier|float|||
|m_AdditionalDamageValueString|Dot&nbsp;Tag-|||
|m_AdditionalDamageValueType|keyword||keyword: DOT_TAG_TOTAL_HEALTH_DAMAGE_OVER_TIME<br>|
|m_AllConditionIds|List(Condition&nbsp;ID)|Conjunctive conditioning. If any of its conditions fail, this skill becomes unavailable.||
|m_AnyConditionIds|List(Condition&nbsp;ID)|Disjunctive conditioning. If all of its conditions fail, this skill becomes unavailable.||
|m_AverageRankIgnored|boolean|Unused field||
|m_CanBeRiposted|boolean|||
|m_ConditionIdOverride|ActorDataSkill&nbsp;ID|Used in upgraded skills to make conditions insensitive to wether this skill is upgraded or not.||
|m_Cooldown|integer|||
|m_DeathClassTagIgnores|List(ActorDataClass&nbsp;Tag-)|If used, enemies killed by this skill will not leave corpses||
|m_HideIfNotValid|boolean|||
|m_HideInvalidSkillTargetValidityTypes|List(keyword)||keyword: invalid_condition, invalid_cooldown, invalid_cost, invalid_forced, invalid_launch, invalid_limit, invalid_pass, invalid_skill_block, invalid_target, valid, valid_editor_prefs, valid_forced, valid_target, valid_token<br>|
|m_IgnoreDamageMultipliers|boolean|||
|m_IsActOut|boolean|||
|m_IsAdditionalEffectsValid|boolean|Default True||
|m_IsAlwaysCooldownUpdating|boolean|||
|m_IsAlwaysEquipped|boolean|||
|m_IsAlwaysInput|boolean|||
|m_IsAlwaysTargetable|boolean|||
|m_IsAutoSelectSelfTarget|boolean|||
|m_IsBlockPass|boolean|||
|m_IsForced|boolean|||
|m_IsFreeAction|boolean|||
|m_IsFriendly|boolean|||
|m_IsFriendlySelfTargetValid|boolean|||
|m_IsLootWindowVisible|boolean|Default True||
|m_IsMoveToTarget|boolean|||
|m_IsMultiHit|boolean|||
|m_IsOnlySelfTargetValid|boolean|||
|m_IsRiposteDamaging|boolean|Used in riposte skills. If set to True, this riposte skill is activated whenever its actor is damaged.||
|m_IsRiposteNonDamaging|boolean|Used in riposte skills. If set to True, this riposte skill is activated whenever its actor targeted.||
|m_IsStallInvalidating|boolean|||
|m_IsStartCooldownOnValidMode|boolean|||
|m_IsStressTriggerValid|boolean|Default True||
|m_IsTokenViewVisible|boolean|Default True||
|m_LaunchRanks|List(integer)|||
|m_Limit|integer|||
|m_MatchingSkillIds|List(ActorDataSkill&nbsp;ID)|Replaces this skill’s description in the Academic’s View||
|m_ModeLinkedActorDataSkillId|ActorDataSkill&nbsp;ID|||
|m_MultiHitAllTargetsConditionIds|List(Condition&nbsp;ID)|||
|m_MultiHitTargetLimit|integer|||
|m_ProfileUnlockId|Unlock&nbsp;ID|||
|m_RandomSelectChance|float|Default 1||
|m_SkillHistoryIdOverride|ActorDataSkill&nbsp;ID|||
|m_SkillModifierChanceModifiers|List(Seq(SkillModifier&nbsp;Tag-, float))|||
|m_Tags|List(ActorDataSkill&nbsp;Tag+)|Common skill tags: melee,ranged,heal,stress_heal||
|m_TargetRelativeRanks|List(integer)|||
|m_Type|keyword|Default turn|keyword: end_round, start_round, turn<br>|
|m_ValidActOutTypes|List(keyword)||keyword: banter, rest_item_block, skill_additional, skill_after, skill_before, skill_block, start_turn, story_choice<br>|
|multi_hit_guaranteed_ranks|List(integer)|||
|multi_hit_shared_token_ignores|List(TokenIgnore&nbsp;ID)|||
|performer_buffs|List(Buff&nbsp;ID)|||
|target_buffs|List(Buff&nbsp;ID)|||
|target_ranks|List(integer)|||
|token_ignores|List(TokenIgnore&nbsp;ID)|||
</details>

<details>
<summary><b>ActorDataSkillReplacement</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|skill_replacements|List(SkillReplacement&nbsp;ID)|||
</details>

<details>
<summary><b>ActorDataStats</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|add_stat|Seq(keyword, float)||keyword: <details><summary>expand</summary>affinity_relationship_tag_chance_modifier, affinity_relationship_tag_extra_duration, crit_chance, deaths_door_chance, dot_effect_value_dealt_change, dot_effect_value_dealt_multiplier, dot_effect_value_received_change, dot_effect_value_received_multiplier, dot_extra_duration_dealt, dot_extra_duration_received, effect_performer_chance_multiplier, effect_target_chance_multiplier, health_damage, health_damage_dealt_mult_percent, health_damage_dealt_percent, health_damage_range, health_damage_received_percent, health_heal_dealt_percent, health_heal_percent_between_nodes, health_heal_received_percent, health_max, inn_quirk_generation_chance_modifier, kingdom_actor_travel_distance, kingdom_actor_travel_effect_chance, kingdom_wound_heal_multiplier, overstress_chance_modifier, resistance, resistance_ignore, rest_item_effect_chance_modifier, route_choice_chance, route_choice_preference, speed, speed_number_of_turns, speed_tie_breaker, stress_max, token_limit, wound_percent_max</details><br>|
|add_stats|Dep*(key_map)|||
|key_map|List(keyword)||keyword: <details><summary>expand</summary>affinity_relationship_tag_chance_modifier, affinity_relationship_tag_extra_duration, crit_chance, deaths_door_chance, dot_effect_value_dealt_change, dot_effect_value_dealt_multiplier, dot_effect_value_received_change, dot_effect_value_received_multiplier, dot_extra_duration_dealt, dot_extra_duration_received, effect_performer_chance_multiplier, effect_target_chance_multiplier, health_damage, health_damage_dealt_mult_percent, health_damage_dealt_percent, health_damage_range, health_damage_received_percent, health_heal_dealt_percent, health_heal_percent_between_nodes, health_heal_received_percent, health_max, inn_quirk_generation_chance_modifier, kingdom_actor_travel_distance, kingdom_actor_travel_effect_chance, kingdom_wound_heal_multiplier, overstress_chance_modifier, resistance, resistance_ignore, rest_item_effect_chance_modifier, route_choice_chance, route_choice_preference, speed, speed_number_of_turns, speed_tie_breaker, stress_max, token_limit, wound_percent_max</details><br>|
|multiply_stat|Seq(keyword, float)||keyword: <details><summary>expand</summary>affinity_relationship_tag_chance_modifier, affinity_relationship_tag_extra_duration, crit_chance, deaths_door_chance, dot_effect_value_dealt_change, dot_effect_value_dealt_multiplier, dot_effect_value_received_change, dot_effect_value_received_multiplier, dot_extra_duration_dealt, dot_extra_duration_received, effect_performer_chance_multiplier, effect_target_chance_multiplier, health_damage, health_damage_dealt_mult_percent, health_damage_dealt_percent, health_damage_range, health_damage_received_percent, health_heal_dealt_percent, health_heal_percent_between_nodes, health_heal_received_percent, health_max, inn_quirk_generation_chance_modifier, kingdom_actor_travel_distance, kingdom_actor_travel_effect_chance, kingdom_wound_heal_multiplier, overstress_chance_modifier, resistance, resistance_ignore, rest_item_effect_chance_modifier, route_choice_chance, route_choice_preference, speed, speed_number_of_turns, speed_tie_breaker, stress_max, token_limit, wound_percent_max</details><br>|
|multiply_stats|Dep*(key_map)|||
|sub_stat|Sub(keyword, Substat, float)||keyword: affinity_relationship_tag_chance_modifier, affinity_relationship_tag_extra_duration, dot_effect_value_dealt_change, dot_effect_value_dealt_multiplier, dot_effect_value_received_change, dot_effect_value_received_multiplier, dot_extra_duration_dealt, dot_extra_duration_received, effect_performer_chance_multiplier, health_heal_dealt_percent, health_heal_received_percent, inn_quirk_generation_chance_modifier, overstress_chance_modifier, resistance, resistance_ignore, rest_item_effect_chance_modifier, route_choice_preference<br>|
</details>

<details>
<summary><b>ActorEffectTrigger</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|effects|List(Effect&nbsp;ID)|||
|m_ActorCount|integer|||
|m_ActorEffectTriggerSourceType|keyword||keyword: performer, target<br>|
|m_ActorEffectTriggerTargetType|keyword||keyword: enemy_team, friendly_team, neighbor, party, performer, target<br>|
|m_ActorEffectType|keyword||keyword: <details><summary>expand</summary>affinity_leaning_negative_change_observing, affinity_leaning_negative_change_participating, affinity_leaning_positive_change_observing, affinity_leaning_positive_change_participating, change_class, combat_end, combat_health_damage, combat_health_damage_enemy_team, combat_health_damage_enemy_team_random, combat_health_damage_friendly_team, combat_health_damage_friendly_team_random, combat_health_heal, combat_health_heal_enemy_team, combat_health_heal_enemy_team_random, combat_health_heal_friendly_team, combat_health_heal_friendly_team_random, combat_start, combat_stress_damage, combat_stress_damage_enemy_team, combat_stress_damage_enemy_team_random, combat_stress_damage_friendly_team, combat_stress_damage_friendly_team_random, combat_stress_heal, combat_stress_heal_enemy_team, combat_stress_heal_enemy_team_random, combat_stress_heal_friendly_team, combat_stress_heal_friendly_team_random, death, deaths_door_enter, deaths_door_exit, deaths_door_survive, embark, enemy_death, enemy_death_team, enemy_team, enemy_team_hit, enemy_team_hit_member_random, enemy_team_member_random, enter_biome, friendly_death, friendly_death_team, friendly_team, friendly_team_hit, friendly_team_hit_member_random, friendly_team_member_random, inn_start, kingdom, kingdom_cleanse, kingdom_contagion, move, move_enemy, move_friendly, node, node_after, node_before, node_execute_completed, node_execute_started, on_attack_as_performer_to_performer, on_attack_as_performer_to_target, on_attack_as_target_to_performer, on_attack_as_target_to_target, on_crit_as_performer_to_performer, on_crit_as_performer_to_target, on_crit_as_target_to_performer, on_crit_as_target_to_target, on_hit_as_performer_to_performer, on_hit_as_performer_to_target, on_hit_as_target_to_performer, on_hit_as_target_to_target, on_kill_as_performer_to_performer, on_kill_as_target_to_performer, on_miss_as_performer_to_performer, on_miss_as_performer_to_target, on_miss_as_target_to_performer, on_miss_as_target_to_target, on_not_crit_as_performer_to_performer, on_not_crit_as_performer_to_target, on_not_crit_as_target_to_performer, on_not_crit_as_target_to_target, on_overstress, on_relationship, on_release_per_round_captured, on_release_per_turn_captured, on_resist, performer, performer_after_target, performer_from_target, performer_neighbor_random, performer_neighbors, performer_on_crit_single, performer_on_kill_fail, performer_per_crit, performer_per_target, performer_team, performer_team_hit, performer_team_hit_member_random, performer_team_hit_others, performer_team_hit_others_member_random, performer_team_member_random, performer_team_others, performer_team_others_member_random, respawn, rest_item, roster_status_enter, roster_status_exit, round_end, round_start, spawn, target, target_neighbor_random, target_neighbors, target_self, target_team, target_team_hit, target_team_hit_member_random, target_team_hit_others, target_team_hit_others_member_random, target_team_member_random, target_team_others, target_team_others_member_random, turn_delay, turn_end, turn_end_enemy_team, turn_end_enemy_team_random, turn_end_friendly_team, turn_end_friendly_team_random, turn_skip, turn_start, turn_start_enemy_team, turn_start_enemy_team_random, turn_start_friendly_team, turn_start_friendly_team_random</details><br>|
|m_ApplyLimit|integer|||
|m_ApplyTargetToSource|boolean|||
|m_IncludeSourceActor|boolean|||
|m_NeighborActorEffectTriggerSourceType|keyword||keyword: performer, target<br>|
|m_NeighborBackCount|integer|||
|m_NeighborFrontCount|integer|||
|m_UseActorDataEffectsConditionCalculationInput|boolean|||
</details>

<details>
<summary><b>ActorStatus</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|enter_effects|List(Effect&nbsp;ID)|||
</details>

<details>
<summary><b>AffinityLeaningLevel</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|m_LeaningMax|integer|||
|m_LeaningMin|integer|||
|m_RelationshipTagChances|List(Seq(AffinityRelationship&nbsp;Tag-, float))|||
</details>

<details>
<summary><b>AffinityRelationship</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|m_Chance|float|||
|m_Tags|List(AffinityRelationship&nbsp;Tag+)|||
|skill_modifiers|List(SkillModifier&nbsp;ID)|||
</details>

<details>
<summary><b>AffinityTickTrigger</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|all_conditions|List(Condition&nbsp;ID)|||
|m_BarkSwapPerformerAndTarget|boolean|||
|m_Chance|float|||
|m_IsTelegraphed|boolean|||
|m_LeaningChange|float|||
|m_RoleType|keyword||keyword: OBSERVING_PERFORMER, OBSERVING_TARGET, PARTICIPATING, PARTICIPATING_SELF<br>|
|m_SkillAttributeTags||||
|m_SkillAttributes|List(keyword)||keyword: affinity_negative, affinity_positive, bark, buff_add, buff_remove, capture, dot_add, dot_copy, dot_remove, dot_steal, health_damage, health_heal, kill, move, quirk_add, quirk_remove, release, stress_damage, stress_heal, token_add, token_convert, token_copy, token_invert, token_remove, token_steal, wound_add, wound_remove<br>|
|m_SkillIsCrit|boolean|||
|m_SkillIsFriendly|boolean|||
|m_Type|keyword||keyword: banter, effect, follow_up, health_heal, performer_moved, revenge, skill<br>|
|performer_effects|List(Effect&nbsp;ID)|||
</details>

<details>
<summary><b>ArenaModifier</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|enter_actor_apply_limit_effects|List(Effect&nbsp;ID)|||
|enter_actor_effects|List(Effect&nbsp;ID)|||
|exit_actor_effects|List(Effect&nbsp;ID)|||
|m_ActorDataTags|List(ActorDataClass&nbsp;Tag-)|||
|m_Cooldown|integer|||
|m_DurationAmount|integer|||
|m_DurationType|keyword||keyword: combat_end, day, embark_end, embark_start, every_turn_end, every_turn_start, infinite, inn_end, inn_start, node, performer_turn_end, performer_turn_start, round_end, round_start, skill_calculate, skill_cooldown, token_calculate_damage<br>|
|m_EnterActorEffectsApplyLimit|integer|||
</details>

<details>
<summary><b>BarkTrigger</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|m_Chance|float|||
|m_DisplayType|keyword||keyword: crimson_curse_bloodlust, crimson_curse_craving, crimson_curse_passive, crimson_curse_wasting, negative, neutral, positive, quest_positive<br>|
|m_Limit|integer|||
|m_Priority|integer|||
|m_RoleType|keyword||keyword: OBSERVING_PERFORMER, OBSERVING_TARGET, PERFORMER, TARGET<br>|
|m_Tags|List(BarkTrigger&nbsp;Tag+)|||
|m_Type|keyword||keyword: ALLY_DEATH, ARENA_MODIFIER_START, ARENA_MODIFIER_STOP, DEATHS_DOOR_SURVIVE, DOT_APPLIED, EFFECT, INN_STARTED, ITEM_APPLIED, OVERSTRESS, ROUTE_TRIGGERED, SKILL_CALCULATED_HIT, SKILL_CRIT, SKILL_MOVE_BACK, SKILL_MOVE_FORWARD, STALL, STATUS_ENTER, STATUS_EXIT, STRESS_DAMAGE, TORCH_DECREASE, TORCH_INCREASE<br>|
</details>

<details>
<summary><b>BattleConfiguration</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|actorless_effects|List(Effect&nbsp;ID)|||
|actorless_round_start_effects|List(Effect&nbsp;ID)|||
|end_actor_all_conditions|List(Condition&nbsp;ID)|||
|hero_effects|List(Effect&nbsp;ID)|||
|m_AdditionalBattleConfigurationTableId|List(BattleConfigurationTable&nbsp;ID)|||
|m_BackgroundSceneOverride||||
|m_BattleModifierOverrideId|List(BattleModifier&nbsp;ID)|||
|m_Chance|float|||
|m_CompleteLootTables|List(LootTable&nbsp;ID)|||
|m_CompleteStoryLootTables|List(LootTable&nbsp;ID)|||
|m_EndActorConditionClassIds|List(ActorDataClass&nbsp;ID)|||
|m_EndAtMaxStress|boolean|||
|m_EndConditionsIsComplete|boolean|||
|m_EndIsAlwaysComplete|boolean|||
|m_EndSequenceDelay|float|||
|m_EnemyActors|List(ActorDataClass&nbsp;ID)|||
|m_EnemyRandomOrder|boolean|||
|m_EnemySummonControllerConfigurationId|SummonControllerConfiguration&nbsp;ID|||
|m_HasEndSequence|boolean|||
|m_IncompleteLootTables|List(LootTable&nbsp;ID)|||
|m_IncompleteStoryLootTables|List(LootTable&nbsp;ID)|||
|m_IsNextBattleOptional|boolean|||
|m_IsRollBattleModifier|boolean|||
|m_IsStallInvalidating|boolean|||
|m_NextBattleConfigurationId|BattleConfiguration&nbsp;ID|||
|m_NextBattleConfigurationTableId|BattleConfigurationTable&nbsp;ID|||
|m_PlayerActors|List(ActorDataClass&nbsp;ID)|||
|m_ResultActors|List(ActorDataClass&nbsp;ID)|||
|m_RoundLimit|integer|||
|m_RunDataStatsId|RunDataStats&nbsp;ID|||
|m_RunLimit|integer|||
|m_Tags|List(BattleConfiguration&nbsp;Tag+)|||
|m_TokenViewValid|boolean|Default True||
|m_TorchOverride|keyword||keyword: no_torch<br>|
|m_endBossCinematicName||||
</details>

<details>
<summary><b>BattleConfigurationTable</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|m_chances|Dep*(m_types)|||
|m_conditions|Dep(m_types)|||
|m_ids|Dep*(m_types)|||
|m_tags|Dep(m_types)|||
|m_types|List(keyword)||keyword: battle_config, nothing, sub_table<br>|
</details>

<details>
<summary><b>BattleModifier</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|all_conditions|List(Condition&nbsp;ID)|||
|m_Chance|float|||
|m_Tags|List(ActorDataClass&nbsp;Tag-)|||
|m_TeamActorLimit|integer|||
</details>

<details>
<summary><b>Biome</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|m_BiomeGroupTag|Biome&nbsp;Tag+|||
|m_DisabledRunValueTypes|List(keyword)||keyword: doom, escalation, hero_upgrade_points, stage_coach_armor, stage_coach_wheels, torch<br>|
|m_InnTable|InnTable&nbsp;ID|||
|m_RequiredStageCoachItemSlotType|keyword||keyword: Flame, General, None, Pet, Trophy<br>|
|m_StoryDefaultBattleConfigurationTable|BattleConfigurationTable&nbsp;ID|||
|road_events|List(RoadEvent&nbsp;ID)|||
|routes|List(Route&nbsp;ID)|||
</details>

<details>
<summary><b>BiomeGoal</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|invalid_biome_modifiers|List(BiomeModifier&nbsp;ID)|||
|m_Chance|float|||
|m_CompleteThresholdAmount|integer|Default -1||
|m_CompleteThresholdType|keyword||keyword: GREATER_THAN, GREATER_THAN_OR_EQUAL, LESS_THAN, LESS_THAN_OR_EQUAL<br>|
|m_FailThresholdAmount|integer|Default -1||
|m_FailThresholdType|keyword||keyword: GREATER_THAN, GREATER_THAN_OR_EQUAL, LESS_THAN, LESS_THAN_OR_EQUAL<br>|
|m_LootId|LootTable&nbsp;ID|||
|m_NumberOfTypicalBiomesMin|integer|||
|m_ShowCountProgressInDriving|boolean|Default True||
|m_Type|keyword||keyword: BATTLE_FINISHED_SOURCE, BATTLE_FINISHED_TAG, BATTLE_STARTED_SOURCE, BATTLE_STARTED_TAG, NODE_VISITED, RUN_VALUE, STAGE_COACH_ITEM_EQUIPPED<br>|
|m_TypeStrings|Dep(m_Type)|||
|m_ValidBiomeTypes|List(keyword)||keyword: Catacombs, Cave, City, Coast, Farm, Forest, Invalid, MountainArms, MountainBody, MountainBrain, MountainEyes, MountainLungs, Tundra, Valley, ValleyIntro, ValleyKingdom<br>|
</details>

<details>
<summary><b>BiomeKillContract</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|m_Chance|float|||
|m_CombatSource|keyword||keyword: ambush, barricade, beastmen_alpha, camp_ambush, cathedral, creature_den, cultist, cultist_mountain_01, cultist_mountain_02, debug, dungeon, gaunt_chirurgeon, guardian, kingdom_boss, kingdom_inn_sieged, oasis, repair, story_assist, story_cosmic, story_hero, story_resist, unset, warlord<br>|
|m_LootIds|LootTable&nbsp;ID|||
|m_MaxDuration|integer|||
|m_MinDuration|integer|||
|m_OverrideBattleConfigurationTableId|BattleConfigurationTable&nbsp;ID|||
|m_ValidBiomeTypes|List(keyword)||keyword: Catacombs, Cave, City, Coast, Farm, Forest, Invalid, MountainArms, MountainBody, MountainBrain, MountainEyes, MountainLungs, Tundra, Valley, ValleyIntro, ValleyKingdom<br>|
</details>

<details>
<summary><b>BiomeModifier</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|m_Chance|float|||
|m_InfectionCooldownDays|integer|||
|m_InnUpgradeIds|List(InnUpgrade&nbsp;ID)|||
|m_LastsForever|boolean|||
|m_RoadEventIds|List(RoadEvent&nbsp;ID)|||
|m_SpreadChance|float|||
|m_SpreadDistance|integer|||
|m_SpreadNumberMax|integer|Default int.MaxValue||
|m_SpreadNumberMin|integer|||
|m_Tags|List(BiomeModifier&nbsp;Tag+)|||
|m_ValidBiomeTypes|List(keyword)||keyword: Catacombs, Cave, City, Coast, Farm, Forest, Invalid, MountainArms, MountainBody, MountainBrain, MountainEyes, MountainLungs, Tundra, Valley, ValleyIntro, ValleyKingdom<br>|
</details>

<details>
<summary><b>BiomeStatus</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|m_DurationAmount|integer|||
|m_DurationType|keyword||keyword: combat_end, day, embark_end, embark_start, every_turn_end, every_turn_start, infinite, inn_end, inn_start, node, performer_turn_end, performer_turn_start, round_end, round_start, skill_calculate, skill_cooldown, token_calculate_damage<br>|
|m_Tags|List(BiomeStatus&nbsp;Tag+)|||
</details>

<details>
<summary><b>BiomeUpgrade</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|m_Tags|List(ActorDataClass&nbsp;Tag-)|||
</details>

<details>
<summary><b>Boss</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|boss_modifiers|List(BossModifier&nbsp;ID)|||
|doom_reset_actorless_effects|List(Effect&nbsp;ID)|||
|doom_reset_hero_effects|List(Effect&nbsp;ID)|||
|m_AcademicsHonorariumLimit|integer|||
|m_EndBiomeType|keyword||keyword: Catacombs, Cave, City, Coast, Farm, Forest, Invalid, MountainArms, MountainBody, MountainBrain, MountainEyes, MountainLungs, Tundra, Valley, ValleyIntro, ValleyKingdom<br>|
|m_IntroNarrationId|List(NarrationEntry&nbsp;ID)|||
|m_IsExtendedById|ExtendedBoss&nbsp;ID|||
|m_IsRunGoalGenerating|boolean|||
|m_OrderedMidNarrationIds|List(NarrationEntry&nbsp;ID)|||
|m_OutroNarrationId|List(NarrationEntry&nbsp;ID)|||
|m_PrefabSubdirectoryId||||
|m_PrerequisiteBossVictoryIds|List(Boss&nbsp;ID)|||
|m_RecurringMidNarrationIds|List(NarrationEntry&nbsp;ID)|||
|m_SelectBiomeType|keyword||keyword: Catacombs, Cave, City, Coast, Farm, Forest, Invalid, MountainArms, MountainBody, MountainBrain, MountainEyes, MountainLungs, Tundra, Valley, ValleyIntro, ValleyKingdom<br>|
|m_TorchLevelGroupId|TorchLevelGroup&nbsp;ID|||
</details>

<details>
<summary><b>BossModifier</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|m_ActorDataEffectsId|ActorDataEffects&nbsp;ID|||
|m_ActorDataTags|List(ActorDataClass&nbsp;Tag-)|||
|m_Chance|float|||
|m_DataExternalBuffsId|DataExternalBuffs&nbsp;ID|||
|m_NumberOfTypicalBiomesMax|integer|||
|m_NumberOfTypicalBiomesMin|integer|||
</details>

<details>
<summary><b>Buff</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|m_ConditionId|Condition&nbsp;ID|||
|m_DurationAmount|integer|||
|m_DurationType|keyword||keyword: combat_end, day, embark_end, embark_start, every_turn_end, every_turn_start, infinite, inn_end, inn_start, node, performer_turn_end, performer_turn_start, round_end, round_start, skill_calculate, skill_cooldown, token_calculate_damage<br>|
|m_InstanceLimit|integer|||
|m_IsVisible|boolean|Default True||
|m_RemoveIfConditionNotMet|boolean|||
|m_SkillBlockId|SkillBlock&nbsp;ID|||
|m_Tags|List(Buff&nbsp;Tag+)|||
|m_UnlockId|Unlock&nbsp;ID|||
|m_showPopText|boolean|Default True||
|token_ignores|List(TokenIgnore&nbsp;ID)|||
</details>

<details>
<summary><b>CinematicSubtitles</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|m_cinematicName||||
|m_locKey||||
|m_startTime|float|||
</details>

<details>
<summary><b>Condition</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|m_ActorIsNotSource|boolean|||
|m_ConditionActorType|keyword||keyword: BOTH, MONSTERS, NONE, PARTY, PERFORMER, PERFORMER_NEIGHBOR_BACK, PERFORMER_NEIGHBOR_FRONT, PERFORMER_TARGET_DIFFERENCE, TARGET, TARGET_NEIGHBOR_BACK, TARGET_NEIGHBOR_FRONT, TARGET_PERFORMER_DIFFERENCE<br>|
|m_ConditionMetTarget|boolean|Default True||
|m_ConditionNumber|float|||
|m_ConditionNumberType|keyword||keyword: BOOL, EQUAL, GREATER_THAN, GREATER_THAN_OR_EQUAL, LESS_THAN, LESS_THAN_OR_EQUAL, MULTIPLE, PARAMETER<br>|
|m_ConditionString|Or(keyword, Dep(m_ConditionType))||keyword: null<br>|
|m_ConditionType|keyword||keyword: <details><summary>expand</summary>actor_count_value, actor_stat_value, always, arena_modifier, battle_configuration_tag_count, biome, biome_count, biome_end_node, biome_history_count, biome_modifier, biome_modifier_tag, biome_modifier_tag_count, biome_siege_strength, biome_status, biome_status_tag_amount, biome_sub_type, biome_typical_count, boss, buff_tag_amount, class, combat_item_equipped, combat_item_equipped_tag, combat_source, day, doom_reset_count, dot_tag_amount, first_initiative, game_type, gang, health_percent, health_percent_wound_included, in_relationship, in_relationship_tag, incomplete_hero_story_choices_amount, inn_days_since_last_siege_attack, inn_days_since_last_siege_resolve, inn_destroy_count, inn_respawn_visit, inn_siege_resolve_visit, inn_tag, inn_upgrade, item, item_amount, item_equipped_tag, item_tag, item_tag_amount, item_total_percent, killed_class_amount, kingdom_class, last_initiative, map_cell_type, mode, node, options_value_bool, overstress, overstress_tag, party_class, path, path_tag_amount, profile_calculated_group_progress, profile_has_defeated_boss, profile_run_end_streak_failure, profile_run_end_streak_victory, profile_unlock, profile_value, quest_complete, quest_step_complete, quest_step_current, quirk, quirk_tag_amount, rank, relationship, relationship_tag, resist, resist_tag, roster_status, roster_status_amount, round, run_value, run_value_percent, siege_count, size, skill, skill_equipped, skill_equipped_tag, skill_received_history_amount, skill_received_history_last, skill_tag, skill_use_history_amount, skill_use_history_last, stage_coach_upgrade_equipped, stage_coach_upgrade_equipped_general_amount, stage_coach_upgrade_equipped_pet_amount, stage_coach_upgrade_equipped_tag, stage_coach_upgrade_equipped_trophy_amount, status, stress, stress_percent, tag, token_amount, token_tag_amount, trinket_equipped, trinket_equipped_tag, turn, wound_percent</details><br>|
|m_IsInverse|boolean|||
|m_IsSkillConditionInputValid|boolean|||
|m_IsVisible|boolean|Default True||
|m_SourceConditionActorType|keyword||keyword: BOTH, MONSTERS, NONE, PARTY, PERFORMER, PERFORMER_NEIGHBOR_BACK, PERFORMER_NEIGHBOR_FRONT, PERFORMER_TARGET_DIFFERENCE, TARGET, TARGET_NEIGHBOR_BACK, TARGET_NEIGHBOR_FRONT, TARGET_PERFORMER_DIFFERENCE<br>|
</details>

<details>
<summary><b>Cost</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|m_AddedLocTag||||
|m_IsItemEquipped|boolean|||
|m_ItemId|Item&nbsp;ID|||
|m_ItemQty|integer|||
|m_ItemTag|Item&nbsp;Tag-|||
|m_ProfileValue|float|||
|m_ProfileValueType|keyword||keyword: candles<br>|
|m_RunValue|float|||
|m_RunValueType|keyword||keyword: doom, escalation, hero_upgrade_points, stage_coach_armor, stage_coach_wheels, torch<br>|
</details>

<details>
<summary><b>DataAffinityTickTriggers</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|affinity_tick_triggers|List(AffinityTickTrigger&nbsp;ID)|||
</details>

<details>
<summary><b>DataExternalBuffs</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|buffs|List(Buff&nbsp;ID)|||
</details>

<details>
<summary><b>DataNodeReplacements</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|node_replacements|List(NodeReplacement&nbsp;ID)|||
</details>

<details>
<summary><b>DataStoryChoiceReplacements</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|story_choice_replacements|List(StoryChoiceReplacement&nbsp;ID)|||
</details>

<details>
<summary><b>DoomLevel</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|m_DoomMax|float|||
|m_DoomMin|float|||
|m_RunDataStatsId|RunDataStats&nbsp;ID|||
</details>

<details>
<summary><b>Dot</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|effects|List(Effect&nbsp;ID)|||
|m_DurationAmount|integer|||
|m_DurationType|keyword||keyword: combat_end, day, embark_end, embark_start, every_turn_end, every_turn_start, infinite, inn_end, inn_start, node, performer_turn_end, performer_turn_start, round_end, round_start, skill_calculate, skill_cooldown, token_calculate_damage<br>|
|m_IgnoreEnemyDealtModifications|boolean|||
|m_IgnoreEnemyReceivedModifications|boolean|||
|m_IgnoreFriendlyDealtModifications|boolean|||
|m_IgnoreFriendlyReceivedModifications|boolean|||
|m_Tags|List(Dot&nbsp;Tag+)|||
|m_Type|DotType&nbsp;Tag+|||
</details>

<details>
<summary><b>Effect</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|all_conditions|List(Condition&nbsp;ID)|Conjunctive conditioning.||
|any_conditions|List(Condition&nbsp;ID)|Disjunctive conditioning.||
|buffs|List(Buff&nbsp;ID)|List of buffs to apply.||
|doom|integer|Change amount of Loathing.||
|escalation|integer|||
|m_AddTurn|integer|Add Action||
|m_AffinityLeaningChange|integer|Change relationship point amount.||
|m_ArenaModifierStartId|ArenaModifier&nbsp;ID|Add ArenaModifier during combat.||
|m_ArenaModifierStopId|ArenaModifier&nbsp;ID|Remove ArenaModifier during combat.||
|m_BarkId||Trigger a bark.||
|m_BiomeKillContractSpawnAmount|integer|||
|m_BiomeModifierId|BiomeModifier&nbsp;ID|||
|m_BiomeModifierSpawnRandom|integer|||
|m_BiomeStatusAddId|BiomeStatus&nbsp;ID|||
|m_BuffRemoveAllTags|List(Buff&nbsp;Tag-)|||
|m_BuffRemoveAmount|integer|||
|m_BuffRemoveAmountRange|integer|||
|m_BuffRemoveRandom|boolean|||
|m_BuffRemoveTag|Buff&nbsp;Tag-|||
|m_Capture|boolean|||
|m_Chance|float|Chance of this effect to be triggered when conditions are met. Default 1.||
|m_ChanceMultiplierStatSubTypes||||
|m_ChancePerRoundSuffix|boolean|||
|m_ChangeClassActorId|ActorDataClass&nbsp;ID|Replace this actor with another.||
|m_ChangeModeId|ActorDataMode&nbsp;ID|||
|m_ClearSkillCooldowns|boolean|||
|m_ClearSkillUses|boolean|||
|m_ConditionId|Condition&nbsp;ID|||
|m_CritChance|float|||
|m_CritMultiplier|float|||
|m_DotAddAmount|integer|||
|m_DotAddId|Dot&nbsp;ID|||
|m_DotCopyAmount|integer|||
|m_DotCopyTags|List(Dot&nbsp;Tag-)|||
|m_DotGiveAmount|integer|||
|m_DotGiveTags|List(Dot&nbsp;Tag-)|||
|m_DotRemoveAllTypes|List(DotType&nbsp;Tag-)|||
|m_DotRemoveAmount|integer|||
|m_DotRemoveId|Dot&nbsp;ID|||
|m_DotStealAmount|integer|||
|m_DotStealTags|List(Dot&nbsp;Tag-)|||
|m_HealthDamageAmount|float|||
|m_HealthDamageDownToPercent|float|||
|m_HealthDamagePercent|float|||
|m_HealthHealAmount|float|||
|m_HealthHealPercent|float|||
|m_HealthHealPercentRange|float|||
|m_HealthHealUpToPercent|float|||
|m_HideHealPreview|boolean|||
|m_IgnoreDeathClass|boolean|||
|m_IgnoreResist|boolean|||
|m_IsAddTurnEndRound|boolean|||
|m_IsAddTurnValidOnExtraTurn|boolean|||
|m_IsAlwaysApply|boolean|||
|m_IsCombo|boolean|||
|m_IsKill|boolean|Instant kill.||
|m_IsLockedTeamPosition|boolean|Locks Token or Dot to the target rank.||
|m_IsSourceOnly|boolean|||
|m_IsVisible|boolean|Is this effect visible in tooktips. Default True||
|m_LootIds|List(LootTable&nbsp;ID)|Get loot from tables.||
|m_LootReasonId||||
|m_Move|integer|Move target. Negative moves target forward. Positive moves target backward.||
|m_MoveRange|integer|||
|m_Priority|integer|||
|m_QuirkAddAmount|integer|Number of Quirks to add.||
|m_QuirkAddAmountRange|integer|||
|m_QuirkAddTag|Quirk&nbsp;Tag-|Add some amount of Quirks that have the specified tag.||
|m_QuirkRemoveAmount|integer|Number of Quirks to remove.||
|m_QuirkRemoveAmountRange|integer|||
|m_QuirkRemoveIsLocked|boolean|||
|m_QuirkRemoveTag|Quirk&nbsp;Tag-|Remove some amount of Quriks that have the specified tag.||
|m_Release|boolean|||
|m_RunValuesIsSetTo|boolean|||
|m_ShowValue|boolean|Specifies if the number of changed tokens should be displayed in tooltips.||
|m_Shuffle|boolean|Shuffle target team.||
|m_SiegeAllDelayChange|integer|||
|m_SiegeAllStrengthChange|integer|||
|m_SiegeSpawnAmount|integer|||
|m_SiegeSpawnAmountRange|integer|||
|m_SortType|keyword||keyword: CLASS_NAME, NAME<br>|
|m_StageCoachUpgradeRemoveId|Item&nbsp;ID|||
|m_StressDamage|float|Deal stress damage to target.||
|m_StressDamageRange|float|||
|m_StressHeal|float|||
|m_StressHealDownFromMax|float|Heal target’s stress.||
|m_SummonAddToTurnOrderAfterCurrentTurnIndex|integer|||
|m_SummonClassActorId|ActorDataClass&nbsp;ID|Summon another actor to target team.||
|m_SummonIfRoom|boolean|||
|m_SummonLocationType|keyword|Specifies on what rank the summoned actor should be placed.|keyword: BACK, FRONT, RANDOM<br>|
|m_TokenAddAmount|integer|Number of tokens to add.||
|m_TokenAddAmountRange|integer|Adds randomness to the number of added tokens. For example if `m_TokenAddAmount` is 1 and `m_TokenAddAmountRange` is 2, the number of added tokens will vary from 1 to 3.||
|m_TokenAddId|Token&nbsp;ID|Add some amount of the specified token.||
|m_TokenAddTag|Token&nbsp;Tag-|Add some amount of tokens that have the specified tag.||
|m_TokenConvertAmount|integer|Number of tokens to convert.||
|m_TokenConvertFromDotTags|List(Dot&nbsp;Tag-)|||
|m_TokenConvertFromTokenIds|List(Token&nbsp;ID)|Token conversion will target the specified tokens on target.||
|m_TokenConvertToId|Token&nbsp;ID|Tokens valid for conversion will be converted to the specified token.||
|m_TokenCopyAmount|integer|Number of tokens to copy from target to performer.||
|m_TokenCopyTags|List(Token&nbsp;Tag-)|Copy some amount of tokens from target to performer. Tokens that have at least one of the specified tags will be copied.||
|m_TokenInvertAmount|integer|Number of tokens to invert. Pairs of inverse tokens are defined in Token elements.||
|m_TokenInvertAmountRange|integer|||
|m_TokenInvertIds|List(Token&nbsp;ID)|Specifies what tokens will be inverted. Pairs of inverse tokens are defined in Token elements.||
|m_TokenRemoveAmount|integer|Number of tokens to remove.||
|m_TokenRemoveId|Token&nbsp;ID|Remove some number of specified tokens.||
|m_TokenRemoveRandom|boolean|Default True||
|m_TokenRemoveTag|Token&nbsp;Tag-|Remove some number of tokens that have the specified tag.||
|m_TokenStealAmount|integer|Number of tokens to steal.||
|m_TokenStealTags|List(Token&nbsp;Tag-)|Steal some amount of tokens from target to performer. Tokens that have at least one of the specified tags will be stolen.||
|m_TreasureAllDurationChange|integer|||
|m_TreasureSpawnAmount|integer|||
|m_UnlockRemoveNonSkillAmount|integer|||
|m_UnlockRemoveNonSkillAmountRange|integer|||
|m_UnlockRemoveUpgradedSkillAmount|integer|||
|m_UnlockRemoveUpgradedSkillAmountRange|integer|||
|m_WoundAddPercent|float|Add fatigue percent. From 0 to 1.||
|m_WoundRemovePercent|float|Remove fatigue percent. From 0 to 1.||
|quirks|List(Quirk&nbsp;ID)|Add specified quirks.||
|stage_coach_armor|integer|Change stagecoach armor. Can be negative.||
|stage_coach_wheels|integer|Change stagecoach wheels. Can be negative.||
|torch|integer|Change torch value. From -100 to 100.||
</details>

<details>
<summary><b>ExtendedBoss</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|boss_modifiers|List(BossModifier&nbsp;ID)|||
|doom_reset_actorless_effects|List(Effect&nbsp;ID)|||
|doom_reset_hero_effects|List(Effect&nbsp;ID)|||
|m_AcademicsHonorariumLimit|integer|||
|m_EndBiomeType|keyword||keyword: Catacombs, Cave, City, Coast, Farm, Forest, Invalid, MountainArms, MountainBody, MountainBrain, MountainEyes, MountainLungs, Tundra, Valley, ValleyIntro, ValleyKingdom<br>|
|m_IntroNarrationId|NarrationEntry&nbsp;ID|||
|m_IsRunGoalGenerating|boolean|||
|m_OrderedMidNarrationIds|List(NarrationEntry&nbsp;ID)|||
|m_OutroNarrationId|NarrationEntry&nbsp;ID|||
|m_PrefabSubdirectoryId||||
|m_RecurringMidNarrationIds|List(NarrationEntry&nbsp;ID)|||
|m_RequiredStageCoachItemSlotType|keyword||keyword: Flame, General, None, Pet, Trophy<br>|
|m_SelectBiomeType|keyword||keyword: Catacombs, Cave, City, Coast, Farm, Forest, Invalid, MountainArms, MountainBody, MountainBrain, MountainEyes, MountainLungs, Tundra, Valley, ValleyIntro, ValleyKingdom<br>|
|m_TorchLevelGroupId|TorchLevelGroup&nbsp;ID|||
</details>

<details>
<summary><b>Gang</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|escalation_torch_level_groups|List(TorchLevelGroup&nbsp;ID)|||
|m_BossBiomeType|keyword||keyword: Catacombs, Cave, City, Coast, Farm, Forest, Invalid, MountainArms, MountainBody, MountainBrain, MountainEyes, MountainLungs, Tundra, Valley, ValleyIntro, ValleyKingdom<br>|
|m_Escalation2KingdomEventId|KingdomEvent&nbsp;ID|||
|m_Escalation3KingdomEventId|KingdomEvent&nbsp;ID|||
|m_IsReleased|boolean|||
|m_QuestId|Quest&nbsp;ID|||
</details>

<details>
<summary><b>Haptics</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|m_actorTags||||
|m_audioSuffix||||
|m_audioSuffixTags||||
|m_audioTags||||
|m_durationIds|List(HapticsDuration&nbsp;ID)|||
|m_intensityIds|List(HapticsIntensity&nbsp;ID)|||
|m_inventoryTags||||
|m_skillUseTags||||
|m_tags||||
</details>

<details>
<summary><b>HapticsDeviceIntensity</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|m_devicePrefixes||||
|m_intensity|float|||
</details>

<details>
<summary><b>HapticsDisabledAudio</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|m_tags||||
</details>

<details>
<summary><b>HapticsDuration</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|m_seconds|float|||
</details>

<details>
<summary><b>HapticsIntensity</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|m_heartbeat1End|float|||
|m_heartbeat1Start|float|||
|m_heartbeat2End|float|||
|m_heartbeat2Start|float|||
|m_maxIntensity|float|||
|m_minIntensity|float|||
|m_period|float|||
|m_type||||
</details>

<details>
<summary><b>Inn</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|actorless_effects|List(Effect&nbsp;ID)|||
|hero_effects|List(Effect&nbsp;ID)|||
|kingdom_hero_effects|List(Effect&nbsp;ID)|||
|m_ActorDataPathChangeCostId|Cost&nbsp;ID|||
|m_BonusLootTableIds|List(LootTable&nbsp;ID)|||
|m_DestroyedCampId|Inn&nbsp;ID|||
|m_HealthHealCostId|Cost&nbsp;ID|||
|m_IgnoreVisitAllAchievement|boolean|||
|m_InnFeatureTypes|List(keyword)||keyword: actor_path_change, fast_travel, item_selling, lock_positive_quirk, physician, remove_disease, remove_negative_quirk, remove_positive_quirk, stage_coach_change_skin, stage_coach_repair, trainer, wainwright<br>|
|m_InnRunDataStatsIds|List(RunDataStats&nbsp;ID)|||
|m_InnStartBarkActorDataIds|List(ActorDataClass&nbsp;ID)|||
|m_InnUpgradeCategories|List(keyword)||keyword: defense, kingdom_camp, kingdom_inn, physician, provisioner, stage_coach_camp, stage_coach_inn, trainer, wainwright<br>|
|m_IsInnBonusValid|boolean|||
|m_LimitInnLevel|integer|||
|m_LimitInnUpgradeCategories|List(keyword)||keyword: defense, kingdom_camp, kingdom_inn, physician, provisioner, stage_coach_camp, stage_coach_inn, trainer, wainwright<br>|
|m_NextBiomeRunDataStatsIds|List(RunDataStats&nbsp;ID)|||
|m_NumberOfBiomeChoices|integer|||
|m_QuirkGenerationAmount|integer|||
|m_QuirkGenerationChance|float|||
|m_QuirkGenerationTags|List(Seq(Quirk&nbsp;Tag-, float))|||
|m_StoreLootTableIds|List(LootTable&nbsp;ID)|||
|m_Tags|List(Inn&nbsp;Tag+)|||
|m_TemporaryInnUpgradeCategories|List(keyword)||keyword: defense, kingdom_camp, kingdom_inn, physician, provisioner, stage_coach_camp, stage_coach_inn, trainer, wainwright<br>|
|m_WoundHealCostId|Cost&nbsp;ID|||
|run_value_transactions|List(RunValueTransaction&nbsp;ID)|||
</details>

<details>
<summary><b>InnBonus</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|actorless_effects|List(Effect&nbsp;ID)|||
|all_conditions|List(Condition&nbsp;ID)|||
|hero_effects|List(Effect&nbsp;ID)|||
|m_BonusLootTableIds|List(LootTable&nbsp;ID)|||
|m_DeliverableIcon||||
|m_InnRunDataStatsIds|RunDataStats&nbsp;ID|||
|m_IsBonusLootExclusive|boolean|||
|m_QuestResource|Quest&nbsp;ID|||
|m_Score|integer|||
</details>

<details>
<summary><b>InnDataStats</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|add_stat|Seq(keyword, float)||keyword: defense, health_max, infection_adjacent_cure_percentage, kingdom_wound_heal_percentage, physician_wound_heal_percentage, repair_percent, siege_resolved_duration, siege_resolved_target_chance, siege_target_chance, stage_coach_item_slot_equip_limit, storage_inventory_max_slots, unlock_skill_limit, upgrade_skill_limit<br>|
|sub_stat|Sub(keyword, Substat, float)||keyword: stage_coach_item_slot_equip_limit<br>|
</details>

<details>
<summary><b>InnTable</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|m_chances|Dep*(m_types)|||
|m_ids|Dep*(m_types)|||
|m_types|List(keyword)||keyword: inn<br>|
</details>

<details>
<summary><b>InnUpgrade</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|actor_unlocks|List(Unlock&nbsp;ID)|||
|actorless_effects|List(Effect&nbsp;ID)|||
|biome_upgrades|List(BiomeUpgrade&nbsp;ID)|||
|hero_effects|List(Effect&nbsp;ID)|||
|kingdom_contagion_effects|List(Effect&nbsp;ID)|||
|kingdom_hero_effects|List(Effect&nbsp;ID)|||
|m_BonusLootTableIds|List(LootTable&nbsp;ID)|||
|m_InnFeatureTypes|List(keyword)||keyword: actor_path_change, fast_travel, item_selling, lock_positive_quirk, physician, remove_disease, remove_negative_quirk, remove_positive_quirk, stage_coach_change_skin, stage_coach_repair, trainer, wainwright<br>|
|m_InnLevel|integer|||
|m_InnRunDataStatsIds|List(RunDataStats&nbsp;ID)|||
|m_InnUpgradeCategory|keyword||keyword: defense, kingdom_camp, kingdom_inn, physician, provisioner, stage_coach_camp, stage_coach_inn, trainer, wainwright<br>|
|m_InnUpgradeType|keyword||keyword: kingdom, major, minor, stage_coach, ultimate<br>|
|m_IsBonusLootExclusive|boolean|||
|m_LevelSpriteIndex|integer|Default -1||
|m_OnPurchaseStoreLootTableIds|List(LootTable&nbsp;ID)|||
|m_Tags|List(InnUpgrade&nbsp;Tag+)|||
|prerequisite_all_inn_upgrades|List(InnUpgrade&nbsp;ID)|||
|prerequisite_any_inn_upgrades|List(InnUpgrade&nbsp;ID)|||
</details>

<details>
<summary><b>Item</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|m_DiscardGameScorePerQty|float|||
|m_DurationAmount|integer|||
|m_DurationType|keyword||keyword: combat_end, day, embark_end, embark_start, every_turn_end, every_turn_start, infinite, inn_end, inn_start, node, performer_turn_end, performer_turn_start, round_end, round_start, skill_calculate, skill_cooldown, token_calculate_damage<br>|
|m_InnUpgradeIds|List(InnUpgrade&nbsp;ID)|||
|m_IsStressTriggerBarking|boolean|||
|m_IsUnequipIfNotInParty|boolean|||
|m_IsUnequipInvalid|boolean|||
|m_OverrideBackgroundFileName||||
|m_QuestResourceId||||
|m_QuestStepId|QuestStep&nbsp;ID|||
|m_RunEndGameScorePerQty|float|||
|m_UnlockId|Unlock&nbsp;ID|||
|m_applyLimitEffectIds|List(Effect&nbsp;ID)|||
|m_buyCostId|Cost&nbsp;ID|||
|m_canDiscard|boolean|Default True||
|m_combinable|boolean|||
|m_combinationApplyLimitEffectIds|List(Effect&nbsp;ID)|||
|m_combinationEffectApplyLimit|integer|||
|m_combinationEffectIds|List(Effect&nbsp;ID)|||
|m_conditionIds|List(Condition&nbsp;ID)|||
|m_effectApplyLimit|integer|||
|m_effectIds|List(Effect&nbsp;ID)|||
|m_forcedTargetActorDataId|ActorDataClass&nbsp;ID|||
|m_hideDamageAndCritTooltip|boolean|||
|m_hideInCollection|boolean|||
|m_hideRunDataStats|boolean|||
|m_isBuyHidden|boolean|||
|m_isConsumable|boolean|||
|m_isRandomTarget|boolean|||
|m_maxQty|integer|||
|m_numberOfTargets|integer|||
|m_partyEffectIds|List(Effect&nbsp;ID)|||
|m_possessionLimit|integer|||
|m_profileLevel|nothing|Unused field||
|m_rewardLinkedTooltipVisible|boolean|Default True||
|m_sellCostId|Cost&nbsp;ID|||
|m_showTargettingInfoInTooltip|boolean|Default True||
|m_slot|keyword||keyword: Flame, General, None, Pet, Trophy<br>|
|m_tags|List(Item&nbsp;Tag+)|||
|m_type|keyword||keyword: combat, currency, memory, memory_reroll, rest, stage_coach_upgrade, trinket<br>|
|m_useTagLimit|integer|||
|m_usedInCombat|boolean|||
|m_usedInDriving|boolean|Unused field||
|m_usedInInn|boolean|||
|sub_type|ItemSubtype&nbsp;ID|||
</details>

<details>
<summary><b>ItemBlock</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|m_ItemIds|List(Item&nbsp;ID)|||
</details>

<details>
<summary><b>ItemSubtype</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|m_LootNarrationTag||||
|m_MinRequiredCountLootNarrationIndex|integer|Default -1||
|m_SortPriority|integer|||
|m_TrinketEquipSfxOverrideEventPath||||
</details>

<details>
<summary><b>KingdomDifficulty</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|actor_path_set_type|integer|||
|escalation_2_day|integer|||
|escalation_3_day|integer|||
|loss_day|integer|||
|loss_percentage_of_inns_destroyed|integer|||
|m_IsDefault|boolean|||
|m_RosterReplacementType|keyword||keyword: none, refill, respawn<br>|
|roster_active_entry_limit|integer|||
|siege_run_stat_index|integer|||
|skill_set_type|integer|||
|start_free_treasures|integer|||
|start_siege_strength|integer|||
</details>

<details>
<summary><b>KingdomEvent</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|all_conditions|List(Condition&nbsp;ID)|||
|effects|List(Effect&nbsp;ID)|||
|inn_upgrades|List(InnUpgrade&nbsp;ID)|||
|m_BiomeModifierId|BiomeModifier&nbsp;ID|||
|m_Chance|float|||
|m_Cooldown|integer|||
|m_EffectRosterStatusTypes|List(keyword)||keyword: captured, dead, hire, hire_replaced, idle, kingdom, load, party, reserve<br>|
|m_EventTypeRarity||||
|m_EventTypeRef||||
|m_IsGeneratedInAdvance|boolean|||
|m_KingdomLimit|integer|||
|m_LootIds|List(LootTable&nbsp;ID)|||
|m_MinGenerationDay|integer|||
|m_Tags|List(ActorDataClass&nbsp;Tag-)|||
</details>

<details>
<summary><b>KingdomMap</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
</details>

<details>
<summary><b>KingdomSiegeAttack</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|all_conditions|List(Condition&nbsp;ID)|||
|m_DestroyChance|float|||
|m_InnHealthDamage|float|||
|m_RemoveRandomUpgradeAmount|integer|||
|m_RemoveRandomUpgradeChance|float|||
</details>

<details>
<summary><b>KingdomSiegeDefense</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|m_ActorClassIds|List(ActorDataClass&nbsp;ID)|||
</details>

<details>
<summary><b>KingdomTreasure</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|m_LootIds|List(LootTable&nbsp;ID)|||
|m_MaxDuration|integer|||
|m_MaxInnLevel|integer|||
|m_MinDuration|integer|||
|m_MinInnLevel|integer|||
|m_TreasureLevel|integer|||
</details>

<details>
<summary><b>LootTable</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|m_chances|Dep*(m_types)|||
|m_conditions|Dep(m_types)|||
|m_ids|Dep*(m_types)|||
|m_qtys|Dep*(m_types)|||
|m_tags|Dep(m_types)|||
|m_types|List(keyword)||keyword: all_sub_table, biome_reward, exclusive_sub_table, item, nothing, profile_unlock, provision, quest_step, sub_table, unique_sub_table<br>|
|m_unlockId|Unlock&nbsp;ID|||
</details>

<details>
<summary><b>NarrationEntry</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|m_allTags||||
|m_anyTags||||
|m_audioEventId||||
|m_avoidTags||||
|m_chance|float|||
|m_disabledGameTypes|keyword||keyword: expedition, kingdom<br>|
|m_guaranteeType|keyword||keyword: always, none, profile_first<br>|
|m_maxOccurrences|Dep(m_occurrenceTypes)|||
|m_numberOfPanels|integer|||
|m_occurrenceTypes|List(keyword)||keyword: altar_of_hope, biome, combat, inn, kingdom, node, profile, run<br>|
|m_type|NarrationType&nbsp;ID|||
</details>

<details>
<summary><b>NarrationType</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|m_chance|float|||
|m_disabledGameTypes|List(keyword)||keyword: expedition, kingdom<br>|
|m_maxOccurrences|Dep*(m_occurrenceTypes)|||
|m_occurrenceTypes|List(keyword)||keyword: altar_of_hope, biome, combat, inn, kingdom, node, profile, run<br>|
</details>

<details>
<summary><b>NodeDeliverable</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|all_conditions|List(Condition&nbsp;ID)|||
|m_LootIds|List(LootTable&nbsp;ID)|||
|m_NodeType|keyword||keyword: AltarOfHope, BeastmenAlpha, BossSelect, Bridge, BridgeGang, Cache, CacheGang, Cathedral, CovenAssist, CreatureDen, Dummy, Dungeon, GameResults, Gate, GauntChirurgeon, Guardian, HeroSelect, Hospital, Inn, KingdomBoss, KingdomCamp, KingdomInn, KingdomInnSieged, Landmark, LandmarkInkfireField, LandmarkTreesDense, LandmarkTreesSparse, Mountain, Oasis, Store, StoryAssist, StoryAssistGang, StoryCosmic, StoryCultist, StoryCultistMountain01, StoryCultistMountain02, StoryHero, StoryHeroReplacement, StoryResist, Unknown, Warlord, WatchTower, null<br>|
|m_Tags|List(NodeDeliverable&nbsp;Tag+)|||
</details>

<details>
<summary><b>NodeReplacement</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|m_AdditionalEndNodeTypes|keyword||keyword: AltarOfHope, BeastmenAlpha, BossSelect, Bridge, BridgeGang, Cache, CacheGang, Cathedral, CovenAssist, CreatureDen, Dummy, Dungeon, GameResults, Gate, GauntChirurgeon, Guardian, HeroSelect, Hospital, Inn, KingdomBoss, KingdomCamp, KingdomInn, KingdomInnSieged, Landmark, LandmarkInkfireField, LandmarkTreesDense, LandmarkTreesSparse, Mountain, Oasis, Store, StoryAssist, StoryAssistGang, StoryCosmic, StoryCultist, StoryCultistMountain01, StoryCultistMountain02, StoryHero, StoryHeroReplacement, StoryResist, Unknown, Warlord, WatchTower, null<br>|
|m_AdditionalStartNodeTypes|keyword||keyword: AltarOfHope, BeastmenAlpha, BossSelect, Bridge, BridgeGang, Cache, CacheGang, Cathedral, CovenAssist, CreatureDen, Dummy, Dungeon, GameResults, Gate, GauntChirurgeon, Guardian, HeroSelect, Hospital, Inn, KingdomBoss, KingdomCamp, KingdomInn, KingdomInnSieged, Landmark, LandmarkInkfireField, LandmarkTreesDense, LandmarkTreesSparse, Mountain, Oasis, Store, StoryAssist, StoryAssistGang, StoryCosmic, StoryCultist, StoryCultistMountain01, StoryCultistMountain02, StoryHero, StoryHeroReplacement, StoryResist, Unknown, Warlord, WatchTower, null<br>|
|m_FromNodeType|keyword||keyword: AltarOfHope, BeastmenAlpha, BossSelect, Bridge, BridgeGang, Cache, CacheGang, Cathedral, CovenAssist, CreatureDen, Dummy, Dungeon, GameResults, Gate, GauntChirurgeon, Guardian, HeroSelect, Hospital, Inn, KingdomBoss, KingdomCamp, KingdomInn, KingdomInnSieged, Landmark, LandmarkInkfireField, LandmarkTreesDense, LandmarkTreesSparse, Mountain, Oasis, Store, StoryAssist, StoryAssistGang, StoryCosmic, StoryCultist, StoryCultistMountain01, StoryCultistMountain02, StoryHero, StoryHeroReplacement, StoryResist, Unknown, Warlord, WatchTower, null<br>|
|m_IsVisible|boolean|Default True||
|m_NodeExitBarkOverrideNodeTypes|keyword||keyword: AltarOfHope, BeastmenAlpha, BossSelect, Bridge, BridgeGang, Cache, CacheGang, Cathedral, CovenAssist, CreatureDen, Dummy, Dungeon, GameResults, Gate, GauntChirurgeon, Guardian, HeroSelect, Hospital, Inn, KingdomBoss, KingdomCamp, KingdomInn, KingdomInnSieged, Landmark, LandmarkInkfireField, LandmarkTreesDense, LandmarkTreesSparse, Mountain, Oasis, Store, StoryAssist, StoryAssistGang, StoryCosmic, StoryCultist, StoryCultistMountain01, StoryCultistMountain02, StoryHero, StoryHeroReplacement, StoryResist, Unknown, Warlord, WatchTower, null<br>|
|m_NodeExitBarkPreferredActorDataIds|List(ActorDataClass&nbsp;ID)|||
|m_ToNodeType|keyword||keyword: AltarOfHope, BeastmenAlpha, BossSelect, Bridge, BridgeGang, Cache, CacheGang, Cathedral, CovenAssist, CreatureDen, Dummy, Dungeon, GameResults, Gate, GauntChirurgeon, Guardian, HeroSelect, Hospital, Inn, KingdomBoss, KingdomCamp, KingdomInn, KingdomInnSieged, Landmark, LandmarkInkfireField, LandmarkTreesDense, LandmarkTreesSparse, Mountain, Oasis, Store, StoryAssist, StoryAssistGang, StoryCosmic, StoryCultist, StoryCultistMountain01, StoryCultistMountain02, StoryHero, StoryHeroReplacement, StoryResist, Unknown, Warlord, WatchTower, null<br>|
|m_ValidBiomeTypes|List(keyword)||keyword: Catacombs, Cave, City, Coast, Farm, Forest, Invalid, MountainArms, MountainBody, MountainBrain, MountainEyes, MountainLungs, Tundra, Valley, ValleyIntro, ValleyKingdom<br>|
</details>

<details>
<summary><b>Overstress</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|effects|List(Effect&nbsp;ID)|||
|m_Chance|float|||
|m_LeaningChange|float|||
|m_ResetPathToDefault|boolean|||
</details>

<details>
<summary><b>Quest</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|m_QuestType|keyword||keyword: game, profile<br>|
|m_ValidGameTypes|keyword||keyword: expedition, kingdom<br>|
|on_completion_unlocks|List(Unlock&nbsp;ID)|||
|quest_steps|List(QuestStep&nbsp;ID)|||
</details>

<details>
<summary><b>QuestStep</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|m_DataNodeReplacementsId|DataNodeReplacements&nbsp;ID|||
|m_DisplayOverrideId||||
|m_InnLootIds|List(LootTable&nbsp;ID)|||
|m_IsKingdomTimelineValid|boolean|||
|m_QuestStepNumber|integer|||
|m_QuestStepString|Dep(m_QuestStepType)|||
|m_QuestStepType|keyword||keyword: inn_bonus, loot, stage_coach_upgrade_equip<br>|
|m_SkipGuaranteedLootIds|List(LootTable&nbsp;ID)|||
</details>

<details>
<summary><b>Quirk</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|generation_all_conditions|List(Condition&nbsp;ID)|||
|m_DurationAmount|integer|||
|m_DurationType|keyword||keyword: combat_end, day, embark_end, embark_start, every_turn_end, every_turn_start, infinite, inn_end, inn_start, node, performer_turn_end, performer_turn_start, round_end, round_start, skill_calculate, skill_cooldown, token_calculate_damage<br>|
|m_EscalationTags|List(Quirk&nbsp;Tag+)|||
|m_Rarity|keyword||keyword: NORMAL, RARE<br>|
|m_ShowDescriptionExplicit|boolean|||
|m_ShowDescriptionFlavor|boolean|||
|m_Tags|List(Quirk&nbsp;Tag+)|||
</details>

<details>
<summary><b>QuirkContainer</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|invalid_quirks|List(Quirk&nbsp;ID)|||
|m_IdGuaranteeGenerationLimits|List(Seq(Quirk&nbsp;ID, integer))|||
|m_TagGenerations|List(Seq(Quirk&nbsp;Tag-, integer))|||
|m_TagLimits|List(Seq(Quirk&nbsp;Tag-, integer))|||
</details>

<details>
<summary><b>Resist</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|m_ActorStatSubType|keyword||keyword: bleed, blight, burn, death, debuff, disease, move, positivetoken, stress, stun<br>|
|m_ActorStatType|keyword||keyword: <details><summary>expand</summary>affinity_relationship_tag_chance_modifier, affinity_relationship_tag_extra_duration, crit_chance, deaths_door_chance, dot_effect_value_dealt_change, dot_effect_value_dealt_multiplier, dot_effect_value_received_change, dot_effect_value_received_multiplier, dot_extra_duration_dealt, dot_extra_duration_received, effect_performer_chance_multiplier, effect_target_chance_multiplier, health_damage, health_damage_dealt_mult_percent, health_damage_dealt_percent, health_damage_range, health_damage_received_percent, health_heal_dealt_percent, health_heal_percent_between_nodes, health_heal_received_percent, health_max, inn_quirk_generation_chance_modifier, kingdom_actor_travel_distance, kingdom_actor_travel_effect_chance, kingdom_wound_heal_multiplier, overstress_chance_modifier, resistance, resistance_ignore, rest_item_effect_chance_modifier, route_choice_chance, route_choice_preference, speed, speed_number_of_turns, speed_tie_breaker, stress_max, token_limit, wound_percent_max</details><br>|
|m_BuffTags|List(Buff&nbsp;Tag-)|||
|m_CritMod|float|||
|m_DotTags|List(Dot&nbsp;Tag-)|||
|m_IgnoreActorStatType|keyword||keyword: <details><summary>expand</summary>affinity_relationship_tag_chance_modifier, affinity_relationship_tag_extra_duration, crit_chance, deaths_door_chance, dot_effect_value_dealt_change, dot_effect_value_dealt_multiplier, dot_effect_value_received_change, dot_effect_value_received_multiplier, dot_extra_duration_dealt, dot_extra_duration_received, effect_performer_chance_multiplier, effect_target_chance_multiplier, health_damage, health_damage_dealt_mult_percent, health_damage_dealt_percent, health_damage_range, health_damage_received_percent, health_heal_dealt_percent, health_heal_percent_between_nodes, health_heal_received_percent, health_max, inn_quirk_generation_chance_modifier, kingdom_actor_travel_distance, kingdom_actor_travel_effect_chance, kingdom_wound_heal_multiplier, overstress_chance_modifier, resistance, resistance_ignore, rest_item_effect_chance_modifier, route_choice_chance, route_choice_preference, speed, speed_number_of_turns, speed_tie_breaker, stress_max, token_limit, wound_percent_max</details><br>|
|m_IgnorePopTextSourceTypes|keyword||keyword: <details><summary>expand</summary>act_out, affinity, altar_of_hope, arena, bark, biome, biome_goal, biome_modifier, biome_status, biome_upgrade, boss, buff, capture, class, combat, death, debug, disease, doom, dot, driving, duration, effect, escalation, hospital, inn, inn_bonus, inn_upgrade, inventory, kingdom, kingdom_event, kingdom_treasure, locked_team_position_transfer, memory, mode, node, overstress, party, path, quest, quirk, quirk_curse, relationship, resist, rest_item, retreat, roster, route, route_choice, run, run_goal, siege, skill, skill_actor, skill_buff, stage_coach_armor, stage_coach_flame, stage_coach_general, stage_coach_pet, stage_coach_trophy, stage_coach_wheels, stall, status, store, story, stress, token, torch, trinket, wound</details><br>|
|m_IsDeath|boolean|||
|m_IsStress|boolean|||
|m_Max|float|Default float.MinValue||
|m_Min|float|Default float.maxValue||
|m_PositiveRunValueTypes|keyword||keyword: doom, escalation, hero_upgrade_points, stage_coach_armor, stage_coach_wheels, torch<br>|
|m_QuirkTags|List(Quirk&nbsp;Tag-)|||
|m_RunStatSubType||||
|m_RunStatType|keyword||keyword: <details><summary>expand</summary>affinity_relationship_tag_chance_modifier, affinity_tick_trigger_negative_chance_multiplier, affinity_tick_trigger_positive_chance_multiplier, battle_configuration_chance, battle_modifier_chance, boss_modifier_chance_modifier, camp_ambush_chance, doom_default_value, doom_effect_number_of_nodes, doom_max_value, doom_min_value, doom_reset_value, escalation_default_value, escalation_max_value, escalation_min_value, hero_upgrade_points_default_value, hero_upgrade_points_max_value, hero_upgrade_points_min_value, hire_chance, hire_typical_biomes_max, hire_typical_biomes_min, item_discard_game_score_chance, item_max_qty, kill_contract_accrual, kill_contract_accrual_range, kill_contract_spawn_limit, kill_contract_spawn_threshold, kingdom_event_generation_chance, loot_chance, loot_qty, map_generation_length_multiplier, map_generation_node_execute_loot_chance, map_generation_node_filler_limit_modifier, map_generation_node_spawn_multiplier, map_generation_nodes_per_row_max, map_generation_nodes_per_row_min, map_generation_nodes_per_row_multiplier, map_generation_road_event_spawn_multiplier, map_generation_route_chance_multiplier, player_inventory_max_slots, resistance, retreat_chance, route_effect_apply_multiplier, run_generation_number_of_optional_biomes, run_generation_number_of_typical_biomes, run_generation_optional_biome_chance, run_generation_typical_biome_chance, score_bonus_multiplier, score_penalty_multiplier, scout_node_chance, scout_route_chance, siege_accrual, siege_accrual_range, siege_delay, siege_delay_range, siege_spawn_limit, siege_spawn_threshold, siege_strength, siege_strength_range, stage_coach_armor_default_value, stage_coach_armor_max_value, stage_coach_armor_min_value, stage_coach_wheels_default_value, stage_coach_wheels_max_value, stage_coach_wheels_min_value, store_cost_buy_multiplier, story_choice_multiplier, torch_add_percent, torch_default_value, torch_drain_between_nodes, torch_max_value, torch_min_value, torch_remove_percent, treasure_accrual, treasure_accrual_range, treasure_spawn_threshold</details><br>|
|m_SkillAttributes|List(keyword)||keyword: affinity_negative, affinity_positive, bark, buff_add, buff_remove, capture, dot_add, dot_copy, dot_remove, dot_steal, health_damage, health_heal, kill, move, quirk_add, quirk_remove, release, stress_damage, stress_heal, token_add, token_convert, token_copy, token_invert, token_remove, token_steal, wound_add, wound_remove<br>|
|m_TokenIds|List(Token&nbsp;ID)|||
|m_TokenTags|List(Token&nbsp;Tag-)|||
</details>

<details>
<summary><b>RoadEvent</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|m_Chance|float|||
|m_RoadEventCategory|keyword||keyword: Ambush, Banter, Objects, Route, null<br>|
|m_ValidGameType|keyword||keyword: expedition, kingdom<br>|
</details>

<details>
<summary><b>Route</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|actorless_effects|List(Effect&nbsp;ID)|||
|m_AllowsBark|boolean|Default True||
|m_AllowsPetSqueal|boolean|Default True||
|m_Chance|float|||
|m_EndingRowsToSkip|integer|||
|m_OverrideNarrationTags||||
|m_RouteType|keyword||keyword: combat, gang_combat, hazard, oblivion_tear, rough_patch, safe, size<br>|
</details>

<details>
<summary><b>Rules</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|actor_transfer_effects|List(Effect&nbsp;ID)|||
|boss_activate_any_conditions|List(Condition&nbsp;ID)|||
|boss_select_destination_any_conditions|List(Condition&nbsp;ID)|||
|disharmonious_effects|List(Effect&nbsp;ID)|||
|disharmonious_relationship_effects|List(Effect&nbsp;ID)|||
|general_slot_unlocks|List(Unlock&nbsp;ID)|||
|harmonious_effects|List(Effect&nbsp;ID)|||
|harmonious_relationship_effects|List(Effect&nbsp;ID)|||
|leaning_affinity_tick_trigger_chance_modifier|Seq(float, float, boolean, float)|Input is a sequence of values: m_MinValue, m_MaxValue, m_IsPositiveChange, m_ChanceModifier||
|m_ActorDataActOutId|ActorDataActOut&nbsp;ID|||
|m_ActorTransferEffectMinDistance|float|||
|m_AffinityRelationshipDuration|integer|||
|m_BattleEndMinHealthHealUpToPercent|float|||
|m_CampAmbushBattleConfigTableId|BattleConfigurationTable&nbsp;ID|||
|m_CampBaseId|Inn&nbsp;ID|||
|m_CritDamageMultiplications|List(float)|||
|m_CritDotExtraDuration|integer|||
|m_CureQuirkByTagCosts|List(Seq(Quirk&nbsp;Tag-, integer))|||
|m_DataAffinityTickTriggersId|DataAffinityTickTriggers&nbsp;ID|||
|m_FirstKillNarrationMaxRound|integer|Default True||
|m_FirstKingdomDefaultPartyActorClassIds|List(ActorDataClass&nbsp;ID)|||
|m_GangBossTag|ActorDataClass&nbsp;Tag-|||
|m_GeneralNumberOfSlots|integer|Default 1||
|m_HeroHurtBigNarrationHealthPercent|float|Default 0.3||
|m_HeroSpecificDeathNarrationChance|float|Default 0.65||
|m_InnBaseId|Inn&nbsp;ID|||
|m_InnInitialFreeUpgradeCounts|List(integer)|||
|m_LeaningDurationCompleteChangeToStart|integer|||
|m_LeaningMax|integer|int.MaxValue||
|m_LeaningMin|integer|int.MinValue||
|m_LeaningStart|integer|||
|m_LeaningStartReserve|integer|||
|m_LockQuirkByTagCosts|List(Seq(Quirk&nbsp;Tag-, integer))|||
|m_LogItemIds|List(Item&nbsp;ID)|||
|m_LogQuirkTags|List(Quirk&nbsp;Tag-)|||
|m_LongCombatNarrationFirstRound|integer|Default 7||
|m_MaxRerollInventory|integer|Default 4||
|m_MemoryLootTableIds|List(LootTable&nbsp;ID)|||
|m_MemoryNumberOfSlots|integer|||
|m_NodeExecuteLootIds|List(LootTable&nbsp;ID)|||
|m_OptionalBiomeMinBiomeTypicalCount|integer|||
|m_PetNumberOfSlots|integer|Default 1||
|m_PointsMin|integer|||
|m_PointsProfileValueType|keyword||keyword: candles<br>|
|m_RemoveQuirkByTagCosts|List(Seq(Quirk&nbsp;Tag-, integer))|||
|m_RespawnStageCoachRefillRunValueTypes|keyword||keyword: doom, escalation, hero_upgrade_points, stage_coach_armor, stage_coach_wheels, torch<br>|
|m_RunDataStatsId|RunDataStats&nbsp;ID|||
|m_SellExecutingNodeTypes|List(keyword)||keyword: AltarOfHope, BeastmenAlpha, BossSelect, Bridge, BridgeGang, Cache, CacheGang, Cathedral, CovenAssist, CreatureDen, Dummy, Dungeon, GameResults, Gate, GauntChirurgeon, Guardian, HeroSelect, Hospital, Inn, KingdomBoss, KingdomCamp, KingdomInn, KingdomInnSieged, Landmark, LandmarkInkfireField, LandmarkTreesDense, LandmarkTreesSparse, Mountain, Oasis, Store, StoryAssist, StoryAssistGang, StoryCosmic, StoryCultist, StoryCultistMountain01, StoryCultistMountain02, StoryHero, StoryHeroReplacement, StoryResist, Unknown, Warlord, WatchTower, null<br>|
|m_SiegeCounterStartMax|integer|||
|m_SiegeCounterStartMin|integer|||
|m_SiegeKingdomTreasureId|KingdomTreasure&nbsp;ID|||
|m_SiegeManualBattleConfigTableId|List(BattleConfigurationTable&nbsp;ID)|||
|m_SiegeMinGenerationDay|integer|||
|m_SiegeStrengthMax|integer|||
|m_SiegeStrengthMin|integer|||
|m_SkillModifierChanceBase|float|||
|m_SkillModifierChancePerSkillUse|float|||
|m_SkipIntroProfileValue|float|||
|m_SkipIntroProfileValueType|keyword||keyword: candles<br>|
|m_SkipValleyRunValues|Seq(keyword, float)||keyword: doom, escalation, hero_upgrade_points, stage_coach_armor, stage_coach_wheels, torch<br>|
|m_StageCoachAdjacentBiomeRewardLootId|LootTable&nbsp;ID|||
|m_StallInvalidatingThresholdPercent|float|||
|m_StallMaxNumberOfEnemies|integer|||
|m_StallMinNumberOfHeroes|integer|||
|m_StallMinRound|integer|||
|m_StartingGold|integer|||
|m_StressPercentageThresholds|List(float)|||
|m_TreasureCounterStartMax|integer|||
|m_TreasureCounterStartMin|integer|||
|m_TrinketNumberOfSlots|integer|||
|m_TrophyNumberOfSlots|integer|Default 1||
|m_TurnOrderSpeedRollPerExtraAction|float|||
|m_TurnOrderSpeedRollRangeMax|float|||
|m_TurnOrderSpeedRollRangeMin|float|||
|m_TurnOrderSpeedRollRound|boolean|||
|m_academicViewCombatLimit|integer|Default 2||
|m_academicViewRoundLimit|integer|Default 2||
|m_affinityTutorialLimit|integer|Default 3||
|m_banterStressChange|float|Default 1||
|m_banterTickTriggerChance|float|||
|m_banterTickTriggerLimit|float|||
|m_betweenNodeAfterNodePercentage|float|Default 0.25||
|m_betweenNodeBeforeNodePercentage|float|Default 0.75||
|m_betweenNodeDeltaPercentage|float|Default 0.2||
|m_betweenNodeMaxPercentage|float|Default 0.95||
|m_betweenNodeMinPercentage|float|Default 0.05||
|m_biomeBossTag|ActorDataClass&nbsp;Tag-|||
|m_chanceOfRelationshipShift|float|Default 0.25||
|m_chanceOfSeatShift|float|Default 0.25||
|m_chanceOfStress|float|Default 0.25||
|m_defaultSize|integer|||
|m_doomMaxTutorialLimit|integer|Default 4||
|m_doomTutorialLimit|integer|Default 1||
|m_drivingHealingPercentLimit|float|Default 0.75||
|m_drivingInfoViewLimit|integer|Default 2||
|m_drivingWoundHeal|float|Default 0.05||
|m_endBossTag|ActorDataClass&nbsp;Tag-|||
|m_farSideRoadEventDistRatio|float|Default 1||
|m_goldId|Item&nbsp;ID|||
|m_heroReplacementMaxDist|integer|Default 5||
|m_heroReplacementMinDist|integer|Default 2||
|m_highThreatQty|integer|Default 3||
|m_innIntroLimit|integer|Default 2||
|m_inventoryFullPercentLimit|float|Default 0.9||
|m_leaguesPerRow|integer|Default 10||
|m_lootInventoryIgnoresMaxQty|boolean|Default True||
|m_lowTorchTutorialLimit|integer|Default 35||
|m_maxNegativeLeaning|integer|Default -4||
|m_minCandlesForLootNarration|integer|Default 1||
|m_minHeroPointsForLootNarration|integer|Default 1||
|m_minItemsForLootNarration|integer|Default 8||
|m_minPositiveLeaning|integer|Default 4||
|m_minRelicsForLootNarration|integer|Default 24||
|m_minStagecoachUpgradesForLootNarration|integer|Default 1||
|m_minTrinketCountsForLootNarration|List(integer)|||
|m_noTorchTutorialLimit|integer|||
|m_nodeExitBarkChance|float|Default 0.5||
|m_nodeExitBarkDelaySeconds|float|Default 1.8||
|m_relationshipChanceOfSeatShift|float|Default 0.5. Unused field||
|m_relationshipChanceOfStress|float|Default 0.5. Unused field||
|m_roadEventRandomizationOffsetRatio|float|Default 0.05||
|m_sideRoadEventDistRatio|float|Default 0.5||
|m_stressTutorialLimit|integer|Default 5||
|m_torchBasicsTutorialLimit|integer|Default 60||
|m_trophiesTutorialBiomeEnterLimit|integer|Default 3||
|node_doom_effects|List(Effect&nbsp;ID)|||
|on_added_to_roster_effects|List(Effect&nbsp;ID)|||
|pet_slot_unlocks|List(Unlock&nbsp;ID)|||
|repeatable_item|Seq(keyword, LootTable&nbsp;ID, List(Cost&nbsp;ID))||keyword: combat, memory_reroll, rest, stage_coach_upgrade, trinket<br>|
|reroll_quirks_costs|List(Cost&nbsp;ID)|||
|retreat_effects|List(Effect&nbsp;ID)|||
|retreat_per_hero_effects|List(Effect&nbsp;ID)|||
|retreat_single_hero_effects|List(Effect&nbsp;ID)|||
|route_choice_unwanted_effects|List(Effect&nbsp;ID)|||
|route_choice_wanted_effects|List(Effect&nbsp;ID)|||
|score_multiplier|Seq(keyword, float)||keyword: academics_honorarium, biome_bosses_cleared, faced_end_boss, fights_won, first_end_boss_victory, hero_stories_cleared, heroes_hired, heroes_survived, inn_bonus, inventory_items, items_discarded, leagues_passed, optional_biomes_cleared, run_goals_class, run_goals_path, start_biomes_cleared, typical_biomes_cleared, victory<br>|
|score_replacement|Seq(keyword, List(integer))||keyword: academics_honorarium, biome_bosses_cleared, faced_end_boss, fights_won, first_end_boss_victory, hero_stories_cleared, heroes_hired, heroes_survived, inn_bonus, inventory_items, items_discarded, leagues_passed, optional_biomes_cleared, run_goals_class, run_goals_path, start_biomes_cleared, typical_biomes_cleared, victory<br>|
|siege_loss_hero_effects|List(Effect&nbsp;ID)|||
|siege_run_data_stats|RunDataStats&nbsp;ID|||
|stall_effects|List(Effect&nbsp;ID)|||
|stress_affinity_tick_trigger_chance_modifier|Seq(float, float, boolean, float)|Input is a sequence of values: m_MinValue, m_MaxValue, m_IsPositiveChange, m_ChanceModifier||
|trinket_slot_unlocks|List(Unlock&nbsp;ID)|||
|trophy_slot_unlocks|List(Unlock&nbsp;ID)|||
</details>

<details>
<summary><b>RunDataStats</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|add_stat|Seq(keyword, float)||keyword: <details><summary>expand</summary>affinity_relationship_tag_chance_modifier, affinity_tick_trigger_negative_chance_multiplier, affinity_tick_trigger_positive_chance_multiplier, battle_configuration_chance, battle_modifier_chance, boss_modifier_chance_modifier, camp_ambush_chance, doom_default_value, doom_effect_number_of_nodes, doom_max_value, doom_min_value, doom_reset_value, escalation_default_value, escalation_max_value, escalation_min_value, hero_upgrade_points_default_value, hero_upgrade_points_max_value, hero_upgrade_points_min_value, hire_chance, hire_typical_biomes_max, hire_typical_biomes_min, item_discard_game_score_chance, item_max_qty, kill_contract_accrual, kill_contract_accrual_range, kill_contract_spawn_limit, kill_contract_spawn_threshold, kingdom_event_generation_chance, loot_chance, loot_qty, map_generation_length_multiplier, map_generation_node_execute_loot_chance, map_generation_node_filler_limit_modifier, map_generation_node_spawn_multiplier, map_generation_nodes_per_row_max, map_generation_nodes_per_row_min, map_generation_nodes_per_row_multiplier, map_generation_road_event_spawn_multiplier, map_generation_route_chance_multiplier, player_inventory_max_slots, resistance, retreat_chance, route_effect_apply_multiplier, run_generation_number_of_optional_biomes, run_generation_number_of_typical_biomes, run_generation_optional_biome_chance, run_generation_typical_biome_chance, score_bonus_multiplier, score_penalty_multiplier, scout_node_chance, scout_route_chance, siege_accrual, siege_accrual_range, siege_delay, siege_delay_range, siege_spawn_limit, siege_spawn_threshold, siege_strength, siege_strength_range, stage_coach_armor_default_value, stage_coach_armor_max_value, stage_coach_armor_min_value, stage_coach_wheels_default_value, stage_coach_wheels_max_value, stage_coach_wheels_min_value, store_cost_buy_multiplier, story_choice_multiplier, torch_add_percent, torch_default_value, torch_drain_between_nodes, torch_max_value, torch_min_value, torch_remove_percent, treasure_accrual, treasure_accrual_range, treasure_spawn_threshold</details><br>|
|add_stats|Dep*(key_map)|||
|key_map|List(keyword)||keyword: <details><summary>expand</summary>affinity_relationship_tag_chance_modifier, affinity_tick_trigger_negative_chance_multiplier, affinity_tick_trigger_positive_chance_multiplier, battle_configuration_chance, battle_modifier_chance, boss_modifier_chance_modifier, camp_ambush_chance, doom_default_value, doom_effect_number_of_nodes, doom_max_value, doom_min_value, doom_reset_value, escalation_default_value, escalation_max_value, escalation_min_value, hero_upgrade_points_default_value, hero_upgrade_points_max_value, hero_upgrade_points_min_value, hire_chance, hire_typical_biomes_max, hire_typical_biomes_min, item_discard_game_score_chance, item_max_qty, kill_contract_accrual, kill_contract_accrual_range, kill_contract_spawn_limit, kill_contract_spawn_threshold, kingdom_event_generation_chance, loot_chance, loot_qty, map_generation_length_multiplier, map_generation_node_execute_loot_chance, map_generation_node_filler_limit_modifier, map_generation_node_spawn_multiplier, map_generation_nodes_per_row_max, map_generation_nodes_per_row_min, map_generation_nodes_per_row_multiplier, map_generation_road_event_spawn_multiplier, map_generation_route_chance_multiplier, player_inventory_max_slots, resistance, retreat_chance, route_effect_apply_multiplier, run_generation_number_of_optional_biomes, run_generation_number_of_typical_biomes, run_generation_optional_biome_chance, run_generation_typical_biome_chance, score_bonus_multiplier, score_penalty_multiplier, scout_node_chance, scout_route_chance, siege_accrual, siege_accrual_range, siege_delay, siege_delay_range, siege_spawn_limit, siege_spawn_threshold, siege_strength, siege_strength_range, stage_coach_armor_default_value, stage_coach_armor_max_value, stage_coach_armor_min_value, stage_coach_wheels_default_value, stage_coach_wheels_max_value, stage_coach_wheels_min_value, store_cost_buy_multiplier, story_choice_multiplier, torch_add_percent, torch_default_value, torch_drain_between_nodes, torch_max_value, torch_min_value, torch_remove_percent, treasure_accrual, treasure_accrual_range, treasure_spawn_threshold</details><br>|
|multiply_stat|Seq(keyword, float)||keyword: <details><summary>expand</summary>affinity_relationship_tag_chance_modifier, affinity_tick_trigger_negative_chance_multiplier, affinity_tick_trigger_positive_chance_multiplier, battle_configuration_chance, battle_modifier_chance, boss_modifier_chance_modifier, camp_ambush_chance, doom_default_value, doom_effect_number_of_nodes, doom_max_value, doom_min_value, doom_reset_value, escalation_default_value, escalation_max_value, escalation_min_value, hero_upgrade_points_default_value, hero_upgrade_points_max_value, hero_upgrade_points_min_value, hire_chance, hire_typical_biomes_max, hire_typical_biomes_min, item_discard_game_score_chance, item_max_qty, kill_contract_accrual, kill_contract_accrual_range, kill_contract_spawn_limit, kill_contract_spawn_threshold, kingdom_event_generation_chance, loot_chance, loot_qty, map_generation_length_multiplier, map_generation_node_execute_loot_chance, map_generation_node_filler_limit_modifier, map_generation_node_spawn_multiplier, map_generation_nodes_per_row_max, map_generation_nodes_per_row_min, map_generation_nodes_per_row_multiplier, map_generation_road_event_spawn_multiplier, map_generation_route_chance_multiplier, player_inventory_max_slots, resistance, retreat_chance, route_effect_apply_multiplier, run_generation_number_of_optional_biomes, run_generation_number_of_typical_biomes, run_generation_optional_biome_chance, run_generation_typical_biome_chance, score_bonus_multiplier, score_penalty_multiplier, scout_node_chance, scout_route_chance, siege_accrual, siege_accrual_range, siege_delay, siege_delay_range, siege_spawn_limit, siege_spawn_threshold, siege_strength, siege_strength_range, stage_coach_armor_default_value, stage_coach_armor_max_value, stage_coach_armor_min_value, stage_coach_wheels_default_value, stage_coach_wheels_max_value, stage_coach_wheels_min_value, store_cost_buy_multiplier, story_choice_multiplier, torch_add_percent, torch_default_value, torch_drain_between_nodes, torch_max_value, torch_min_value, torch_remove_percent, treasure_accrual, treasure_accrual_range, treasure_spawn_threshold</details><br>|
|multiply_stats|Dep*(key_map)|||
|sub_stat|Sub(keyword, Substat, float)||keyword: battle_configuration_chance, item_max_qty, loot_chance, loot_qty, map_generation_node_execute_loot_chance, map_generation_node_filler_limit_modifier, map_generation_node_spawn_multiplier, map_generation_route_chance_multiplier, resistance, route_effect_apply_multiplier, run_generation_typical_biome_chance, score_penalty_multiplier, scout_node_chance, scout_route_chance, store_cost_buy_multiplier, torch_remove_percent<br>|
</details>

<details>
<summary><b>RunGoal</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|all_conditions|List(Condition&nbsp;ID)|||
|any_conditions|List(Condition&nbsp;ID)|||
|generation_all_conditions|List(Condition&nbsp;ID)|||
|m_ActorClassIds|List(ActorDataClass&nbsp;ID)|||
|m_Chance|float|||
|m_CompletionLimit|integer|||
|m_GoalIconOverride|keyword||keyword: candle_item, rest, trinket<br>|
|m_GoalTooltipLocKeyOverride||||
|m_LootTableId|LootTable&nbsp;ID|||
|m_RunGoalCategoryId|RunGoalCategory&nbsp;ID|||
|m_Score|integer|||
</details>

<details>
<summary><b>RunGoalCategory</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|m_PrerequisiteRunGoalCategoryId|RunGoalCategory&nbsp;ID|||
</details>

<details>
<summary><b>RunLevel</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|m_NumberOfTypicalBiomesMax|integer|||
|m_NumberOfTypicalBiomesMin|integer|||
|m_UnlockId|Unlock&nbsp;ID|||
</details>

<details>
<summary><b>RunValueLevel</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|m_IsPercent|boolean|||
|m_IsVisible|boolean|Default True||
|m_Max|float|||
|m_Min|float|||
|m_RunValueType|keyword||keyword: doom, escalation, hero_upgrade_points, stage_coach_armor, stage_coach_wheels, torch<br>|
|m_Tags|List(ActorDataClass&nbsp;Tag-)|||
</details>

<details>
<summary><b>RunValueTransaction</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|m_RunValueType|keyword||keyword: doom, escalation, hero_upgrade_points, stage_coach_armor, stage_coach_wheels, torch<br>|
|m_StoreCostMultiplierId|keyword||keyword: inn_wainwright<br>|
|m_TransactionAmount|float|||
|m_isDiscounted|boolean|||
</details>

<details>
<summary><b>SkillBlock</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|effect_skill_attribute_tags||||
|m_PerformerSkillTags|List(ActorDataSkill&nbsp;Tag-)|||
|m_TargetSkillTags|List(ActorDataSkill&nbsp;Tag-)|||
</details>

<details>
<summary><b>SkillModifier</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|effects|List(Effect&nbsp;ID)|||
|m_Chance|float|||
|m_IsForceEquip|boolean|||
|m_Tags|List(SkillModifier&nbsp;Tag+)|||
</details>

<details>
<summary><b>SkillReplacement</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|m_FromActorDataSkillId|ActorDataSkill&nbsp;ID|||
|m_IsPathComparisonValid|boolean|Default True||
|m_ToActorDataSkillId|ActorDataSkill&nbsp;ID|||
</details>

<details>
<summary><b>SkillSet</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|m_IsDefault|boolean|||
|skills|List(ActorDataSkill&nbsp;ID)|||
</details>

<details>
<summary><b>StageCoachSkin</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|m_UnlockId|Unlock&nbsp;ID|||
</details>

<details>
<summary><b>StoryAlignment</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|m_DisharmoniousAlignments|List(StoryAlignment&nbsp;ID)|||
|m_HarmoniousAlignments|List(StoryAlignment&nbsp;ID)|||
</details>

<details>
<summary><b>StoryChoice</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|all_conditions|List(Condition&nbsp;ID)|||
|m_AlignmentId|StoryAlignment&nbsp;ID|||
|m_AnyTags||||
|m_Chance|float|||
|m_CostId|Cost&nbsp;ID|||
|m_DrawTags|List(StoryChoiceDraw&nbsp;Tag+)|||
|m_EnemyStoryChoicePreviewIds||||
|m_EnemyStoryChoicePreviewShowNumbers|List(boolean)|||
|m_EnemyStoryChoicePreviewValues|List(integer)|||
|m_ExclusiveTags||||
|m_PlayerStoryChoicePreviewIds||||
|m_PlayerStoryChoicePreviewShowNumbers|List(boolean)|||
|m_PlayerStoryChoicePreviewValues|List(integer)|||
|m_ProgressGroupId|keyword||keyword: base, base_cosmetic, base_item, base_story, dlc, dlc_altar, dlc_cosmetic, dlc_item, dlc_story<br>|
|m_ResultActorClassId|ActorDataClass&nbsp;ID|||
|m_ResultAudioOverrideId||||
|m_ResultBattleConfigurationId|BattleConfiguration&nbsp;ID|||
|m_ResultBattleConfigurationTableId|BattleConfigurationTable&nbsp;ID|||
|m_ResultLootIds|List(LootTable&nbsp;ID)|||
|m_ResultType|keyword||keyword: COMBAT, COUNT, DRIVING, NONE, UI<br>|
|m_ScoutDist|integer|||
|m_ScoutPercent|float|||
</details>

<details>
<summary><b>StoryChoiceReplacement</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|m_FromDrawTags|List(StoryChoiceDraw&nbsp;Tag-)|||
|m_RemoveDrawTags|List(StoryChoiceDraw&nbsp;Tag-)|||
|m_ToDrawTags|List(StoryChoiceDraw&nbsp;Tag-)|||
</details>

<details>
<summary><b>StoryDataEffects</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|enemy_actor_effects|List(Effect&nbsp;ID)|||
|party_actor_combat_effects|List(Effect&nbsp;ID)|||
|party_actor_effects|List(Effect&nbsp;ID)|||
|selection_actor_combat_effects|List(Effect&nbsp;ID)|||
|selection_actor_effects|List(Effect&nbsp;ID)|||
</details>

<details>
<summary><b>StressTrigger</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|all_conditions|Condition&nbsp;ID|||
|m_Chance|float|||
|m_FilterId||||
|m_QueueFailedPresentationChance|float|||
|m_RoleType|keyword||keyword: OBSERVING_PERFORMER, OBSERVING_TARGET, PARTY, PERFORMER, TARGET<br>|
|m_Stress|float|||
|m_TriggerLimit|integer|||
|m_Type|keyword||keyword: crit, death, deaths_door, node_path_taken, pet_inspect, road_event_completed<br>|
</details>

<details>
<summary><b>SummonControllerConfiguration</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|m_ShowWaveProgress|boolean|||
|sequence|List(SummonSequenceElement&nbsp;ID)|||
</details>

<details>
<summary><b>SummonSequenceElement</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|all_conditions|List(Condition&nbsp;ID)|||
|m_ActorClassId|ActorDataClass&nbsp;ID|||
|m_IfRoom|boolean|||
|m_LocationType|keyword||keyword: BACK, FRONT, RANDOM<br>|
</details>

<details>
<summary><b>Token</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|consume_buffs|List(Buff&nbsp;ID)|||
|m_AlwaysRemove|boolean|||
|m_Chance|float|||
|m_ConditionId|Condition&nbsp;ID|||
|m_ConsumeLimit|integer|||
|m_ConsumePriority|integer|||
|m_ConsumeTypes|keyword||keyword: block_dot_apply, block_move, block_stress_damage, crit, deaths_door_armor, delay_turn, evade, extra_launch, extra_target, forced_target, guard, guarding, manual, on_damaging_blocked, on_damaging_hit, on_damaging_miss, on_killed, on_non_damaging_hit, on_non_damaging_miss, passive, riposte, round_end_buff, round_start_buff, skill_buff, skill_calculate_damage_buff, skill_damage_buff, skill_effect, skill_token_ignore, skip_turn, stealth, turn<br>|
|m_DurationAmount|integer|||
|m_DurationIsSingleRemove|boolean|||
|m_DurationType|keyword||keyword: combat_end, day, embark_end, embark_start, every_turn_end, every_turn_start, infinite, inn_end, inn_start, node, performer_turn_end, performer_turn_start, round_end, round_start, skill_calculate, skill_cooldown, token_calculate_damage<br>|
|m_InvertTokenId|Token&nbsp;ID|Specifies an inverse token pair for this one. This information is used in effects that inverse tokens.||
|m_IsExclusiveSource|boolean|||
|m_IsHidden|boolean|||
|m_IsPerformer|boolean|||
|m_IsRankToken|boolean|Adds a square bracket indicator under this token's icon, doesn't have gameplay effects||
|m_IsRemovedOnSourceCapture|boolean|||
|m_IsRemovedOnSourceDeath|boolean|||
|m_IsTarget|boolean|||
|m_Limit|integer|Maximum number of tokens on an actor.||
|m_NegateAllIds|List(Token&nbsp;ID)|||
|m_NegateIds|List(Token&nbsp;ID)|||
|m_PreviewValidStatuses|List(keyword)||keyword: deaths_door<br>|
|m_RemoveTypes|List(keyword)||keyword: block_dot_apply, block_move, block_stress_damage, crit, deaths_door_armor, delay_turn, evade, extra_launch, extra_target, forced_target, guard, guarding, manual, on_damaging_blocked, on_damaging_hit, on_damaging_miss, on_killed, on_non_damaging_hit, on_non_damaging_miss, passive, riposte, round_end_buff, round_start_buff, skill_buff, skill_calculate_damage_buff, skill_damage_buff, skill_effect, skill_token_ignore, skip_turn, stealth, turn<br>|
|m_ShowCombatDuration|boolean|Default True||
|m_ShowConsumePopText|boolean|Default True||
|m_ShowDescription|boolean|Default True||
|m_ShowName|boolean|Default True||
|m_Tags|List(Token&nbsp;Tag+)|Arbitrary tags of this token.||
|m_TeamLimit|integer|Maximum number of tokens on all team actors.||
|m_TokenGlossaryAlwaysDisplay|boolean|||
|m_TokenGlossaryBiomeTag|Biome&nbsp;Tag-|||
|m_TokenGlossaryHeroTag|Or(ActorDataClass&nbsp;Tag-, ActorDataClass&nbsp;ID)|||
|m_TokenGlossaryPathTag|List(Or(ActorDataPath&nbsp;Tag-, ActorDataPath&nbsp;ID))|||
|m_TokenGlossaryTagDisplay|List(BattleConfiguration&nbsp;Tag-)|||
|remove_any_conditions|List(Condition&nbsp;ID)|Removes this token when specified condition is met.||
|replace|Seq(Token&nbsp;ID, keyword, Token&nbsp;ID)|When this token is applied, it will replace specified token with another specified token.|keyword: WITH<br>|
</details>

<details>
<summary><b>TokenIgnore</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|all_conditions|List(Condition&nbsp;ID)|||
|any_conditions|List(Condition&nbsp;ID)|||
|m_IgnoredTokenIds|List(Token&nbsp;ID)|||
|m_IgnoredTokenTypes|List(keyword)||keyword: block_dot_apply, block_move, block_stress_damage, crit, deaths_door_armor, delay_turn, evade, extra_launch, extra_target, forced_target, guard, guarding, manual, on_damaging_blocked, on_damaging_hit, on_damaging_miss, on_killed, on_non_damaging_hit, on_non_damaging_miss, passive, riposte, round_end_buff, round_start_buff, skill_buff, skill_calculate_damage_buff, skill_damage_buff, skill_effect, skill_token_ignore, skip_turn, stealth, turn<br>|
|m_IsInstanceAddedToPerformer|boolean|||
|m_IsInstanceAddedToTarget|boolean|||
|m_IsInstanceSourcePerformer|boolean|||
|m_IsInstanceSourceTarget|boolean|||
|m_IsVisible|boolean|||
</details>

<details>
<summary><b>TorchLevel</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|m_Tags|List(ActorDataClass&nbsp;Tag-)|||
|m_TorchMax|float|||
|m_TorchMin|float|||
</details>

<details>
<summary><b>TorchLevelGroup</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|torch_levels|List(TorchLevel&nbsp;ID)|||
</details>

<details>
<summary><b>TorchTrigger</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|m_Tags|List(ActorDataClass&nbsp;Tag-)|||
|m_TorchChange|float|||
|m_Type|keyword||keyword: CRIT, DEATH, DEATHS_DOOR, RELATIONSHIP<br>|
</details>

<details>
<summary><b>TrinketSet</b></summary>
Unused Element

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|m_ExternalBuffsId|List(DataExternalBuffs&nbsp;ID)|||
</details>

<details>
<summary><b>Unlock</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|m_CostId|Cost&nbsp;ID|||
|m_RequirementIds|Or(ActorDataSkill&nbsp;ID, Unlock&nbsp;ID)|||
</details>

<details>
<summary><b>UnlockTable</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|cost|Seq(Cost&nbsp;ID, float, float)|Sets cost depending on unlock progress. Numbers are the decimal proportion of progress. Between these bounds the cost is set to the specified Cost.||
|m_ProgressGroupId|keyword||keyword: base, base_cosmetic, base_item, base_story, dlc, dlc_altar, dlc_cosmetic, dlc_item, dlc_story<br>|
|m_chances|Dep*(m_types)|||
|m_ids|Dep*(m_types)|||
|m_types|List(keyword)||keyword: unlock<br>|
</details>

<details>
<summary><b>UnlockTrack</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|m_ProgressGroupId|keyword||keyword: base, base_cosmetic, base_item, base_story, dlc, dlc_altar, dlc_cosmetic, dlc_item, dlc_story<br>|
|unlocks|List(Unlock&nbsp;ID)|||
</details>

<details>
<summary><b>WoundTrigger</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|m_Chance|float|||
|m_ConditionId|Condition&nbsp;ID|||
|m_InputMin|float|Default float.MinValue||
|m_InputType|keyword||keyword: health_max_percent, kingdom_day<br>|
|m_SourceId|Overstress&nbsp;ID|||
|m_Type|keyword||keyword: deaths_door, health_damage, inn_start, kingdom_actor_transfer, overstress<br>|
|m_WoundPercentChange|float|||
|m_WoundPercentMax|float|Default float.MaxValue||
</details>
