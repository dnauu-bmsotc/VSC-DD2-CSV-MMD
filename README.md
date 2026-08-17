# CSV Extension for Darkest Dungeon 2

Syntax highlighting and validation for Darkest Dungeon 2 CSV files.

## Features
- Syntax highlighting for DD2 CSV files
- Validation of:
	- element_start and element_end placement.
	- element type spelling.

# CSV data description


<details>
<summary><b>Achievement</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|m_allTags|Dep(m_type)|||
|m_anyTags|Dep(m_type)|||
|m_avoidTags|Dep(m_type)|||
|m_destinationTags|Dep(m_type)|m_sourceTags and m_destinationTags must both be empty or not empty||
|m_eachTags|Dep(m_type)|||
|m_number|integer|Incompatible with m_targetInt and m_targetFloat||
|m_sourceTags|Dep(m_type)|||
|m_targetFloat|float|Can't have both m_targetInt and m_targetFloat defined||
|m_targetInt|integer|||
|m_type|keyword||keyword: <details><summary>expand</summary>party_relationship_pair, kingdom_campaign_use_items, inventory_item_add, kingdom_victory_uninfected_heroes, profile_unlock, biome_complete, inn_treasure_campaign_sum, skill_mastery, inn_visit_all, inventory_full, actor_death_inventory_full, node_deliverable_campaign_sum, confession_victory_consecutive, actor_death_skill_use_active_tokens, kingdom_inn_capstones, kingdom_kill_contracts, party_relationships, roster_confirm, profile_unlock_group, skill_use_processed_tokens, actor_death_count_from_source, affinity_overstress, actor_death_combat_sum, inventory_item_purchase, actor_death_with_source, combat_party_has_quirk, roster_relationships_unique, affinity_overstress_chain, quest_complete, skill_health_damage, hospital_full_service, driving_distance, skill_use, release_anniversary, quest_step_story_choices, confession_victory, combat_skill_hits, game_mode_transition, tokens_removed_campaign_sum, run_end, item_triggered_effects, kingdom_victory, altar_of_hope_total_progress, actor_death, party_wipe, replacement_hero_add, actor_death_run_sum, combat_victory, biome_complete_group, party_classes, hire_mercenary, collected_trophies</details><br>|
</details>

<details>
<summary><b>ActOut</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|all_conditions|List(Condition&nbsp;ID)|Conjunctive conditioning. If any of the conditions specified in this field aren’t met, there will be no roll for this act out.||
|any_conditions|List(Condition&nbsp;ID)|Conjunctive conditioning. If all of the conditions specified in this field aren’t met, there will be no roll for this act out.||
|effects|List(Effect&nbsp;ID)|||
|m_ActorType|keyword|if this act out is skill-related then this field only accepts PERORMER, TARGET, or SELF.|keyword: OTHER, PERFORMER, PARTY, TARGET, SELF<br>|
|m_AdditionalSkillTags|List(ActorDataSkill&nbsp;Tag-)|If m_Type is set to skill_aditional, this field is used to specify what skill to choose. If multiple tags are specified, it looks for a skill with any number of these tags. If multiple skills match this selector, only the first one is selected.||
|m_BarkSwapPerformerAndTarget|boolean|||
|m_Chance|float|Chance of triggering this act out if conditions are met.||
|m_DelayCooldownDurationAmount|integer|||
|m_DelayCooldownDurationType|keyword||keyword: performer_turn_start, performer_turn_end, every_turn_start, every_turn_end, round_start, round_end, combat_end, inn_start, inn_end, embark_start, embark_end, infinite, skill_calculate, skill_cooldown, token_calculate_damage, node, day<br>|
|m_DisplayType|keyword||keyword: negative, crimson_curse_craving, positive, crimson_curse_passive, crimson_curse_wasting, crimson_curse_bloodlust<br>|
|m_EffectSwapPerformerAndTarget|boolean|||
|m_IsFriendly|boolean|||
|m_IsGuardingValid|boolean|Default True||
|m_IsMultihitValid|boolean|Default True||
|m_IsZoomIn|boolean|Only act outs that have m_Type set to skill_after, skill_block, or start_turn can use this field.||
|m_Priority|integer|||
|m_RandomStartCooldownDurationAmount|integer|||
|m_RandomStartCooldownDurationType|keyword||keyword: performer_turn_start, performer_turn_end, every_turn_start, every_turn_end, round_start, round_end, combat_end, inn_start, inn_end, embark_start, embark_end, infinite, skill_calculate, skill_cooldown, token_calculate_damage, node, day<br>|
|m_SelectCooldownDurationAmount|integer|||
|m_SelectCooldownDurationType|keyword||keyword: performer_turn_start, performer_turn_end, every_turn_start, every_turn_end, round_start, round_end, combat_end, inn_start, inn_end, embark_start, embark_end, infinite, skill_calculate, skill_cooldown, token_calculate_damage, node, day<br>|
|m_SelectDelayTags|List(keyword)||keyword: minor<br>|
|m_SourceIdLimit|integer|||
|m_SourceTypeLimit|integer|||
|m_Tags|List(ActOut&nbsp;Tag+)|||
|m_Type|keyword||keyword: skill_before, skill_after, skill_block, skill_additional, start_turn, banter, story_choice, rest_item_block<br>|
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
|m_ActorControllerType|keyword|RANDOM makes this actor to choose skills randomly. Move and wait actions count as skills too. This also supports INPUT which lets player to control what skill will be chosen.|keyword: INPUT, RANDOM, TEST, SEQUENTIAL_SKILL_TEST<br>|
|m_ClearContainerKeepTags|List(Or(Dot&nbsp;Tag-, Buff&nbsp;Tag-, Token&nbsp;Tag-))|||
|m_ClearContainerTypes|List(keyword)|If another actor was transformed into this actor, buffs/DOTs/tokens will be removed. This is important, for example, for the final Confession boss that uses hidden tokens to track if a hero is still alive.|keyword: TokenContainer, BuffContainer, DebuffContainer, DotContainer<br>|
|m_DeathBackActorClassIds|List(ActorDataClass&nbsp;ID)|||
|m_DeathChainIds|List(ActorDataClass&nbsp;ID)|If the actor referenced by this field dies, this actor dies too||
|m_DeathChainLootIds|List(LootTable&nbsp;ID)|||
|m_DeathClassAddsTurn|boolean|||
|m_DeathClassRemovesTurns|boolean|Default True||
|m_DeathFrontActorClassIds|List(ActorDataClass&nbsp;ID)|||
|m_DeathLootIds|List(LootTable&nbsp;ID)|||
|m_DeathRound|integer|||
|m_DefaultActorDataPathId|ActorDataPath&nbsp;ID|||
|m_EquippedCombatSkillLimit|integer|It can be increased, but values above 6 lead to UI overlaps, at least on my screen.||
|m_ExpeditionUnlockId|Unlock&nbsp;ID|||
|m_IgnoredSkillAttributeTypes|List(keyword)|Disallows this actor to gain buffs/quirks/tokens|keyword: health_damage, health_heal, wound_add, wound_remove, stress_damage, stress_heal, move, token_add, token_remove, token_convert, token_steal, token_copy, token_invert, dot_add, dot_remove, dot_steal, dot_copy, buff_add, buff_remove, quirk_add, quirk_remove, affinity_positive, affinity_negative, bark, capture, release, kill<br>|
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
|m_LocalizationGender|keyword||keyword: female, male<br>|
|m_NameOverrideId|Localization|||
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
|m_StartingRosterStatusType|keyword||keyword: idle, party, reserve, dead, load, captured, hire, hire_replaced, kingdom<br>|
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
|m_BarkOverrideKey|Localization|||
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
|m_AdditionalDamageActorType|keyword||keyword: PERFORMER, PERFORMER_NEIGHBOR_FRONT, PERFORMER_NEIGHBOR_BACK, TARGET, TARGET_NEIGHBOR_FRONT, TARGET_NEIGHBOR_BACK<br>|
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
|m_HideInvalidSkillTargetValidityTypes|List(keyword)||keyword: valid, valid_forced, valid_editor_prefs, valid_token, valid_target, invalid_target, invalid_launch, invalid_skill_block, invalid_cooldown, invalid_limit, invalid_cost, invalid_forced, invalid_pass, invalid_condition<br>|
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
|m_Type|keyword|Default turn|keyword: turnstart_round, end_round<br>|
|m_ValidActOutTypes|List(keyword)||keyword: skill_before, skill_after, skill_block, skill_additional, start_turn, banter, story_choice, rest_item_block<br>|
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
|add_stat|Seq(keyword, float)||keyword: <details><summary>expand</summary>speed, speed_tie_breaker, speed_number_of_turns, crit_chance, health_damage, health_damage_range, health_damage_dealt_percent, health_damage_dealt_mult_percent, health_damage_received_percent, health_max, wound_percent_max, stress_max, deaths_door_chance, resistance, resistance_ignore, health_heal_dealt_percent, health_heal_received_percent, health_heal_percent_between_nodes, route_choice_chance, route_choice_preference, dot_extra_duration_dealt, dot_extra_duration_received, dot_effect_value_dealt_change, dot_effect_value_received_change, dot_effect_value_dealt_multiplier, dot_effect_value_received_multiplier, affinity_relationship_tag_chance_modifier, affinity_relationship_tag_extra_duration, overstress_chance_modifier, inn_quirk_generation_chance_modifier, kingdom_actor_travel_distance, kingdom_actor_travel_effect_chance, kingdom_wound_heal_multiplier, rest_item_effect_chance_modifier, token_limit, effect_performer_chance_multiplier, effect_target_chance_multiplier</details><br>|
|add_stats|List(float)|||
|key_map|List(keyword)||keyword: <details><summary>expand</summary>speed, speed_tie_breaker, speed_number_of_turns, crit_chance, health_damage, health_damage_range, health_damage_dealt_percent, health_damage_dealt_mult_percent, health_damage_received_percent, health_max, wound_percent_max, stress_max, deaths_door_chance, resistance, resistance_ignore, health_heal_dealt_percent, health_heal_received_percent, health_heal_percent_between_nodes, route_choice_chance, route_choice_preference, dot_extra_duration_dealt, dot_extra_duration_received, dot_effect_value_dealt_change, dot_effect_value_received_change, dot_effect_value_dealt_multiplier, dot_effect_value_received_multiplier, affinity_relationship_tag_chance_modifier, affinity_relationship_tag_extra_duration, overstress_chance_modifier, inn_quirk_generation_chance_modifier, kingdom_actor_travel_distance, kingdom_actor_travel_effect_chance, kingdom_wound_heal_multiplier, rest_item_effect_chance_modifier, token_limit, effect_performer_chance_multiplier, effect_target_chance_multiplier</details><br>|
|multiply_stat|Seq(keyword, float)||keyword: <details><summary>expand</summary>speed, speed_tie_breaker, speed_number_of_turns, crit_chance, health_damage, health_damage_range, health_damage_dealt_percent, health_damage_dealt_mult_percent, health_damage_received_percent, health_max, wound_percent_max, stress_max, deaths_door_chance, resistance, resistance_ignore, health_heal_dealt_percent, health_heal_received_percent, health_heal_percent_between_nodes, route_choice_chance, route_choice_preference, dot_extra_duration_dealt, dot_extra_duration_received, dot_effect_value_dealt_change, dot_effect_value_received_change, dot_effect_value_dealt_multiplier, dot_effect_value_received_multiplier, affinity_relationship_tag_chance_modifier, affinity_relationship_tag_extra_duration, overstress_chance_modifier, inn_quirk_generation_chance_modifier, kingdom_actor_travel_distance, kingdom_actor_travel_effect_chance, kingdom_wound_heal_multiplier, rest_item_effect_chance_modifier, token_limit, effect_performer_chance_multiplier, effect_target_chance_multiplier</details><br>|
|multiply_stats|List(float)|||
|sub_stat|Seq(keyword1, keyword2, float)||keyword1: <details><summary>expand</summary>speed, speed_tie_breaker, speed_number_of_turns, crit_chance, health_damage, health_damage_range, health_damage_dealt_percent, health_damage_dealt_mult_percent, health_damage_received_percent, health_max, wound_percent_max, stress_max, deaths_door_chance, resistance, resistance_ignore, health_heal_dealt_percent, health_heal_received_percent, health_heal_percent_between_nodes, route_choice_chance, route_choice_preference, dot_extra_duration_dealt, dot_extra_duration_received, dot_effect_value_dealt_change, dot_effect_value_received_change, dot_effect_value_dealt_multiplier, dot_effect_value_received_multiplier, affinity_relationship_tag_chance_modifier, affinity_relationship_tag_extra_duration, overstress_chance_modifier, inn_quirk_generation_chance_modifier, kingdom_actor_travel_distance, kingdom_actor_travel_effect_chance, kingdom_wound_heal_multiplier, rest_item_effect_chance_modifier, token_limit, effect_performer_chance_multiplier, effect_target_chance_multiplier</details><br>keyword2: Bridge, Cache, CreatureDen, Dungeon, Gate, HeroSelect, Hospital, Inn, Oasis, Store, StoryAssist, StoryCosmic, StoryCultist, StoryHero, StoryHeroReplacement, StoryResist, Unknown, WatchTower, abm_moribund_stress_multiplier, bleed, blight, burn, death, debuff, disease, food, horror, hot, meltdown, move, neg_inn_normal, neg_inn_rare, negative, positive, positivetoken, resolute, rest_item, skill, stress, stun<br>|
</details>

<details>
<summary><b>ActorEffectTrigger</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|effects|List(Effect&nbsp;ID)|||
|m_ActorCount|integer|||
|m_ActorEffectTriggerSourceType|keyword||keyword: target, performer<br>|
|m_ActorEffectTriggerTargetType|keyword||keyword: performer, target, friendly_team, enemy_team, party, neighbor<br>|
|m_ActorEffectType|keyword||keyword: <details><summary>expand</summary>performer, performer_per_target, performer_per_crit, performer_from_target, target, target_self, target_team, target_team_hit, target_team_member_random, target_team_hit_member_random, target_team_others, target_team_hit_others, target_team_others_member_random, target_team_hit_others_member_random, spawn, change_class, respawn, performer_on_crit_single, death, combat_start, combat_end, inn_start, embark, round_start, round_end, performer_team, performer_team_hit, performer_team_member_random, performer_team_hit_member_random, performer_after_target, performer_on_kill_fail, performer_team_others, performer_team_hit_others, performer_team_others_member_random, performer_team_hit_others_member_random, combat_health_damage, combat_health_damage_friendly_team, combat_health_damage_friendly_team_random, combat_health_damage_enemy_team, combat_health_damage_enemy_team_random, combat_health_heal, combat_health_heal_friendly_team, combat_health_heal_friendly_team_random, combat_health_heal_enemy_team, combat_health_heal_enemy_team_random, turn_start, turn_start_friendly_team, turn_start_friendly_team_random, turn_start_enemy_team, turn_start_enemy_team_random, turn_skip, turn_delay, turn_end, turn_end_friendly_team, turn_end_friendly_team_random, turn_end_enemy_team, turn_end_enemy_team_random, enter_biome, node, deaths_door_enter, deaths_door_exit, deaths_door_survive, combat_stress_damage, combat_stress_damage_friendly_team, combat_stress_damage_friendly_team_random, combat_stress_damage_enemy_team, combat_stress_damage_enemy_team_random, combat_stress_heal, combat_stress_heal_friendly_team, combat_stress_heal_friendly_team_random, combat_stress_heal_enemy_team, combat_stress_heal_enemy_team_random, move, move_friendly, move_enemy, on_attack_as_performer_to_performer, on_attack_as_performer_to_target, on_attack_as_target_to_performer, on_attack_as_target_to_target, on_hit_as_performer_to_performer, on_hit_as_performer_to_target, on_hit_as_target_to_performer, on_hit_as_target_to_target, on_crit_as_performer_to_performer, on_crit_as_performer_to_target, on_crit_as_target_to_performer, on_crit_as_target_to_target, on_not_crit_as_performer_to_performer, on_not_crit_as_performer_to_target, on_not_crit_as_target_to_performer, on_not_crit_as_target_to_target, on_miss_as_performer_to_performer, on_miss_as_performer_to_target, on_miss_as_target_to_performer, on_miss_as_target_to_target, on_kill_as_performer_to_performer, on_kill_as_target_to_performer, affinity_leaning_positive_change_participating, affinity_leaning_positive_change_observing, affinity_leaning_negative_change_participating, affinity_leaning_negative_change_observing, friendly_team, friendly_team_hit, friendly_team_member_random, friendly_team_hit_member_random, enemy_team, enemy_team_hit, enemy_team_member_random, enemy_team_hit_member_random, friendly_death, enemy_death, friendly_death_team, enemy_death_team, node_before, node_execute_started, node_execute_completed, node_after, performer_neighbors, performer_neighbor_random, target_neighbors, target_neighbor_random, rest_item, on_release_per_round_captured, on_release_per_turn_captured, on_resist, roster_status_enter, roster_status_exit, on_overstress, on_relationship, kingdom, kingdom_contagion, kingdom_cleanse</details><br>|
|m_ApplyLimit|integer|||
|m_ApplyTargetToSource|boolean|||
|m_IncludeSourceActor|boolean|||
|m_NeighborActorEffectTriggerSourceType|keyword||keyword: target, performer<br>|
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
|m_RoleType|keyword||keyword: PARTICIPATING, PARTICIPATING_SELF, OBSERVING_PERFORMER, OBSERVING_TARGET<br>|
|m_SkillAttributeTags||||
|m_SkillAttributes|List(keyword)||keyword: health_damage, health_heal, wound_add, wound_remove, stress_damage, stress_heal, move, token_add, token_remove, token_convert, token_steal, token_copy, token_invert, dot_add, dot_remove, dot_steal, dot_copy, buff_add, buff_remove, quirk_add, quirk_remove, affinity_positive, affinity_negative, bark, capture, release, kill<br>|
|m_SkillIsCrit|boolean|||
|m_SkillIsFriendly|boolean|||
|m_Type|keyword||keyword: skill, effect, health_heal, performer_moved, revenge, follow_up, banter<br>|
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
|m_DurationType|keyword||keyword: performer_turn_start, performer_turn_end, every_turn_start, every_turn_end, round_start, round_end, combat_end, inn_start, inn_end, embark_start, embark_end, infinite, skill_calculate, skill_cooldown, token_calculate_damage, node, day<br>|
|m_EnterActorEffectsApplyLimit|integer|||
</details>

<details>
<summary><b>BarkTrigger</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|m_Chance|float|||
|m_DisplayType|keyword||keyword: neutral, positive, negative, quest_positive, crimson_curse_bloodlust, crimson_curse_craving, crimson_curse_passive, crimson_curse_wasting<br>|
|m_Limit|integer|||
|m_Priority|integer|||
|m_RoleType|keyword||keyword: PERFORMER, TARGET, OBSERVING_PERFORMER, OBSERVING_TARGET<br>|
|m_Tags|List(BarkTrigger&nbsp;Tag+)|||
|m_Type|keyword||keyword: STALL, DOT_APPLIED, STRESS_DAMAGE, TORCH_INCREASE, TORCH_DECREASE, STATUS_ENTER, STATUS_EXIT, DEATHS_DOOR_SURVIVE, SKILL_MOVE_FORWARD, SKILL_MOVE_BACK, SKILL_CRIT, ITEM_APPLIED, EFFECT, ARENA_MODIFIER_START, ARENA_MODIFIER_STOP, INN_STARTED, ROUTE_TRIGGERED, OVERSTRESS, SKILL_CALCULATED_HIT, ALLY_DEATH<br>|
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
|m_BackgroundSceneOverride|keyword||keyword: <details><summary>expand</summary>combat_arena_mountain_boss_eyes, combat_arena_hero_story_duelist_origin_1, combat_arena_farm_dungeon_exterior, combat_arena_hero_story_occultist_origin_2, combat_arena_hero_story_graverobber_origin_2, combat_arena_hero_story_crusader_origin_1, combat_arena_stressworld, combat_arena_caves_creature_den, combat_arena_city_creature_den, combat_arena_farm_dungeon_interior, combat_arena_hero_story_manatarms_origin_2, combat_arena_hero_story_vestal_origin_1, combat_arena_city_dungeon_interior, combat_arena_hero_story_jester_origin_2, combat_arena_hero_story_duelist_origin_2, combat_arena_mountain_boss_brain, combat_arena_hero_story_jester_origin_1, combat_arena_forest_dungeon_interior, combat_arena_hero_story_manatarms_origin_1, combat_arena_hero_story_abomination_origin_1, combat_arena_hero_story_leper_origin_1, combat_arena_valley_barricade_gang_beastmen, combat_arena_tundra_creature_den, combat_arena_hero_story_plaguedoctor_origin_1, combat_arena_hero_story_hellion_origin_2, combat_arena_hero_story_abomination_origin_2, combat_arena_hero_story_graverobber_origin_1, combat_arena_hero_story_occultist_origin_1, combat_arena_mountain_boss_body, combat_arena_mountain_boss_lungs, combat_arena_hero_story_runaway_origin_1, combat_arena_forest_dungeon_exterior, combat_arena_tundra_dungeon_interior, combat_arena_hero_story_runaway_origin_2, combat_arena_hero_story_highwayman_origin_1, combat_arena_coast_creature_den, combat_arena_mountain_boss_arms, combat_arena_coast_dungeon_exterior, combat_arena_valley_barricade_gang_coven, combat_arena_forest_creature_den, combat_arena_hero_story_hellion_origin_1, combat_arena_tundra_dungeon_exterior, combat_arena_valley_barricade_gang_courtier, combat_arena_hero_story_vestal_origin_2, combat_arena_farm_creature_den, combat_arena_hero_story_flagellant_origin_1, combat_arena_city_dungeon_exterior, combat_arena_hero_story_plaguedoctor_origin_2, combat_arena_catacombs_creature_den, combat_arena_hero_story_leper_origin_2, combat_arena_coast_dungeon_interior, combat_arena_hero_story_crusader_origin_2, combat_arena_hero_story_highwayman_origin_2</details><br>|
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
|m_endBossCinematicName|keyword||keyword: EndBossVictory<br>|
</details>

<details>
<summary><b>BattleConfigurationTable</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|m_chances|List(float)|||
|m_conditions|List(Condition&nbsp;ID)|||
|m_ids|List(Or(BattleConfiguration&nbsp;ID, BattleConfigurationTable&nbsp;ID))|||
|m_tags|List(BattleConfigurationEntry&nbsp;Tag+)|||
|m_types|List(keyword)||keyword: sub_table, nothing, battle_config<br>|
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
|m_DisabledRunValueTypes|List(keyword)||keyword: torch, hero_upgrade_points, doom, stage_coach_armor, stage_coach_wheels, escalation<br>|
|m_InnTable|InnTable&nbsp;ID|||
|m_RequiredStageCoachItemSlotType|keyword||keyword: None, General, Trophy, Pet, Flame<br>|
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
|m_CompleteThresholdType|keyword||keyword: LESS_THAN, LESS_THAN_OR_EQUAL, GREATER_THAN, GREATER_THAN_OR_EQUAL<br>|
|m_FailThresholdAmount|integer|Default -1||
|m_FailThresholdType|keyword||keyword: LESS_THAN, LESS_THAN_OR_EQUAL, GREATER_THAN, GREATER_THAN_OR_EQUAL<br>|
|m_LootId|LootTable&nbsp;ID|||
|m_NumberOfTypicalBiomesMin|integer|||
|m_ShowCountProgressInDriving|boolean|Default True||
|m_Type|keyword||keyword: STAGE_COACH_ITEM_EQUIPPED, RUN_VALUE, NODE_VISITED, BATTLE_STARTED_SOURCE, BATTLE_FINISHED_SOURCE, BATTLE_STARTED_TAG, BATTLE_FINISHED_TAG<br>|
|m_TypeStrings|List(Or(Token&nbsp;ID, keyword1, keyword2, keyword3))||keyword1: Cache, Gate, Hospital, Inn, Store, WatchTower, StoryCultist, StoryCultistMountain01, StoryCultistMountain02, StoryAssist, StoryResist, StoryCosmic, StoryHero, StoryHeroReplacement, Dungeon, Guardian, CreatureDen, Oasis, HeroSelect, AltarOfHope, Bridge, GameResults, BossSelect, Landmark, Cathedral, Dummy, Mountain, LandmarkTreesDense, LandmarkTreesSparse, LandmarkInkfireField, Unknown, GauntChirurgeon, Warlord, BeastmenAlpha, KingdomInn, KingdomInnSieged, KingdomCamp, KingdomBoss, StoryAssistGang, CacheGang, BridgeGang, CovenAssist, null<br>keyword2: torch, hero_upgrade_points, doom, stage_coach_armor, stage_coach_wheels, escalation<br>keyword3: None, General, Trophy, Pet, Flame<br>|
|m_ValidBiomeTypes|List(keyword)||keyword: Valley, ValleyIntro, ValleyKingdom, City, Farm, Forest, Coast, Tundra, Cave, Catacombs, MountainBrain, MountainLungs, MountainEyes, MountainArms, MountainBody, Invalid<br>|
</details>

<details>
<summary><b>BiomeKillContract</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|m_Chance|float|||
|m_CombatSource|keyword||keyword: debug, unset, barricade, dungeon, cultist, cultist_mountain_01, cultist_mountain_02, story_assist, story_resist, story_cosmic, story_hero, guardian, oasis, creature_den, cathedral, gaunt_chirurgeon, repair, ambush, warlord, kingdom_inn_sieged, kingdom_boss, beastmen_alpha, camp_ambush<br>|
|m_LootIds|LootTable&nbsp;ID|||
|m_MaxDuration|integer|||
|m_MinDuration|integer|||
|m_OverrideBattleConfigurationTableId|BattleConfigurationTable&nbsp;ID|||
|m_ValidBiomeTypes|List(keyword)||keyword: Valley, ValleyIntro, ValleyKingdom, City, Farm, Forest, Coast, Tundra, Cave, Catacombs, MountainBrain, MountainLungs, MountainEyes, MountainArms, MountainBody, Invalid<br>|
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
|m_ValidBiomeTypes|List(keyword)||keyword: Valley, ValleyIntro, ValleyKingdom, City, Farm, Forest, Coast, Tundra, Cave, Catacombs, MountainBrain, MountainLungs, MountainEyes, MountainArms, MountainBody, Invalid<br>|
</details>

<details>
<summary><b>BiomeStatus</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|m_DurationAmount|integer|||
|m_DurationType|keyword||keyword: performer_turn_start, performer_turn_end, every_turn_start, every_turn_end, round_start, round_end, combat_end, inn_start, inn_end, embark_start, embark_end, infinite, skill_calculate, skill_cooldown, token_calculate_damage, node, day<br>|
|m_Tags|List(BiomeStatus&nbsp;Tag+)|||
</details>

<details>
<summary><b>BiomeUpgrade</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|m_Tags|List(ActorDataClass&nbsp;ID)|||
</details>

<details>
<summary><b>Boss</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|boss_modifiers|List(BossModifier&nbsp;ID)|||
|doom_reset_actorless_effects|List(Effect&nbsp;ID)|||
|doom_reset_hero_effects|List(Effect&nbsp;ID)|||
|m_AcademicsHonorariumLimit|integer|||
|m_EndBiomeType|keyword||keyword: Valley, ValleyIntro, ValleyKingdom, City, Farm, Forest, Coast, Tundra, Cave, Catacombs, MountainBrain, MountainLungs, MountainEyes, MountainArms, MountainBody, Invalid<br>|
|m_IntroNarrationId|List(NarrationEntry&nbsp;ID)|||
|m_IsExtendedById|ExtendedBoss&nbsp;ID|||
|m_IsRunGoalGenerating|boolean|||
|m_OrderedMidNarrationIds|List(NarrationEntry&nbsp;ID)|||
|m_OutroNarrationId|List(NarrationEntry&nbsp;ID)|||
|m_PrefabSubdirectoryId|keyword||keyword: Resentment, Denial<br>|
|m_PrerequisiteBossVictoryIds|List(Boss&nbsp;ID)|||
|m_RecurringMidNarrationIds|List(NarrationEntry&nbsp;ID)|||
|m_SelectBiomeType|keyword||keyword: Valley, ValleyIntro, ValleyKingdom, City, Farm, Forest, Coast, Tundra, Cave, Catacombs, MountainBrain, MountainLungs, MountainEyes, MountainArms, MountainBody, Invalid<br>|
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
|m_DurationType|keyword||keyword: performer_turn_start, performer_turn_end, every_turn_start, every_turn_end, round_start, round_end, combat_end, inn_start, inn_end, embark_start, embark_end, infinite, skill_calculate, skill_cooldown, token_calculate_damage, node, day<br>|
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
|m_cinematicName|keyword||keyword: BossSelect, EndBossVictory<br>|
|m_locKey|Localization|||
|m_startTime|float|||
</details>

<details>
<summary><b>Condition</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|m_ActorIsNotSource|boolean|||
|m_ConditionActorType|keyword||keyword: NONE, PERFORMER, TARGET, BOTH, PARTY, MONSTERS, PERFORMER_TARGET_DIFFERENCE, TARGET_PERFORMER_DIFFERENCE, PERFORMER_NEIGHBOR_FRONT, PERFORMER_NEIGHBOR_BACK, TARGET_NEIGHBOR_FRONT, TARGET_NEIGHBOR_BACK<br>|
|m_ConditionMetTarget|boolean|Default True||
|m_ConditionNumber|float|||
|m_ConditionNumberType|keyword||keyword: EQUAL, LESS_THAN, LESS_THAN_OR_EQUAL, GREATER_THAN, GREATER_THAN_OR_EQUAL, MULTIPLE, PARAMETER, BOOL<br>|
|m_ConditionString|Dep(m_ConditionType)|||
|m_ConditionType|keyword||keyword: <details><summary>expand</summary>always, token_amount, token_tag_amount, health_percent, health_percent_wound_included, wound_percent, class, mode, size, tag, path, path_tag_amount, dot_tag_amount, stress, stress_percent, quirk, quirk_tag_amount, buff_tag_amount, rank, status, skill_use_history_amount, skill_use_history_last, skill_received_history_amount, skill_received_history_last, skill_equipped, skill_equipped_tag, trinket_equipped, trinket_equipped_tag, combat_item_equipped, combat_item_equipped_tag, actor_stat_value, actor_count_value, first_initiative, last_initiative, in_relationship, in_relationship_tag, incomplete_hero_story_choices_amount, party_class, kingdom_class, roster_status_amount, quest_complete, quest_step_complete, quest_step_current, run_value, run_value_percent, boss, biome, biome_sub_type, biome_modifier, biome_modifier_tag, biome_siege_strength, biome_end_node, biome_count, biome_history_count, biome_typical_count, biome_status, biome_status_tag_amount, item_amount, item_tag_amount, item_total_percent, stage_coach_upgrade_equipped, stage_coach_upgrade_equipped_tag, stage_coach_upgrade_equipped_general_amount, stage_coach_upgrade_equipped_trophy_amount, stage_coach_upgrade_equipped_pet_amount, doom_reset_count, game_type, gang, day, siege_count, battle_configuration_tag_count, map_cell_type, biome_modifier_tag_count, options_value_bool, skill, skill_tag, profile_unlock, profile_value, profile_run_end_streak_victory, profile_run_end_streak_failure, profile_calculated_group_progress, profile_has_defeated_boss, round, turn, killed_class_amount, arena_modifier, combat_source, item, item_tag, node, inn_tag, inn_upgrade, inn_days_since_last_siege_resolve, inn_days_since_last_siege_attack, inn_siege_resolve_visit, inn_respawn_visit, inn_destroy_count, resist, resist_tag, roster_status, relationship, relationship_tag, overstress, overstress_tag, item_equipped_tag</details><br>|
|m_IsInverse|boolean|||
|m_IsSkillConditionInputValid|boolean|||
|m_IsVisible|boolean|Default True||
|m_SourceConditionActorType|keyword||keyword: NONE, PERFORMER, TARGET, BOTH, PARTY, MONSTERS, PERFORMER_TARGET_DIFFERENCE, TARGET_PERFORMER_DIFFERENCE, PERFORMER_NEIGHBOR_FRONT, PERFORMER_NEIGHBOR_BACK, TARGET_NEIGHBOR_FRONT, TARGET_NEIGHBOR_BACK<br>|
</details>

<details>
<summary><b>Cost</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|m_AddedLocTag|Localization|||
|m_IsItemEquipped|boolean|||
|m_ItemId|Item&nbsp;ID|||
|m_ItemQty|integer|||
|m_ItemTag|Item&nbsp;Tag-|||
|m_ProfileValue|float|||
|m_ProfileValueType|keyword||keyword: candles<br>|
|m_RunValue|float|||
|m_RunValueType|keyword||keyword: torch, hero_upgrade_points, doom, stage_coach_armor, stage_coach_wheels, escalation<br>|
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
|m_DurationType|keyword||keyword: performer_turn_start, performer_turn_end, every_turn_start, every_turn_end, round_start, round_end, combat_end, inn_start, inn_end, embark_start, embark_end, infinite, skill_calculate, skill_cooldown, token_calculate_damage, node, day<br>|
|m_IgnoreEnemyDealtModifications|boolean|||
|m_IgnoreEnemyReceivedModifications|boolean|||
|m_IgnoreFriendlyDealtModifications|boolean|||
|m_IgnoreFriendlyReceivedModifications|boolean|||
|m_Tags|List(Dot&nbsp;Tag+)|||
|m_Type|keyword||keyword: taproot_strangle, horror, blight, hot, burn, bleed<br>|
</details>

<details>
<summary><b>Effect</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|all_conditions|List(Condition&nbsp;ID)|||
|any_conditions|List(Condition&nbsp;ID)|||
|buffs|List(Buff&nbsp;ID)|||
|doom|integer|||
|escalation|integer|||
|m_AddTurn|integer|||
|m_AffinityLeaningChange|integer|||
|m_ArenaModifierStartId|ArenaModifier&nbsp;ID|||
|m_ArenaModifierStopId|ArenaModifier&nbsp;ID|||
|m_BarkId|Localization|||
|m_BiomeKillContractSpawnAmount|List(Or(Token&nbsp;ID, keyword1, keyword2, keyword3))||keyword1: Cache, Gate, Hospital, Inn, Store, WatchTower, StoryCultist, StoryCultistMountain01, StoryCultistMountain02, StoryAssist, StoryResist, StoryCosmic, StoryHero, StoryHeroReplacement, Dungeon, Guardian, CreatureDen, Oasis, HeroSelect, AltarOfHope, Bridge, GameResults, BossSelect, Landmark, Cathedral, Dummy, Mountain, LandmarkTreesDense, LandmarkTreesSparse, LandmarkInkfireField, Unknown, GauntChirurgeon, Warlord, BeastmenAlpha, KingdomInn, KingdomInnSieged, KingdomCamp, KingdomBoss, StoryAssistGang, CacheGang, BridgeGang, CovenAssist, null<br>keyword2: torch, hero_upgrade_points, doom, stage_coach_armor, stage_coach_wheels, escalation<br>keyword3: None, General, Trophy, Pet, Flame<br>|
|m_BiomeModifierId|BiomeModifier&nbsp;ID|||
|m_BiomeModifierSpawnRandom|integer|||
|m_BiomeStatusAddId|BiomeStatus&nbsp;ID|||
|m_BuffRemoveAllTags|List(Buff&nbsp;Tag-)|||
|m_BuffRemoveAmount|integer|||
|m_BuffRemoveAmountRange|integer|||
|m_BuffRemoveRandom|boolean|||
|m_BuffRemoveTag|Buff&nbsp;Tag-|||
|m_Capture|boolean|||
|m_Chance|float|Default 1||
|m_ChanceMultiplierStatSubTypes|List(keyword)||keyword: abm_moribund_stress_multiplier<br>|
|m_ChancePerRoundSuffix|boolean|||
|m_ChangeClassActorId|ActorDataClass&nbsp;ID|||
|m_ChangeModeId|Mode&nbsp;ID|||
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
|m_DotRemoveAllTypes|List(keyword)||keyword: taproot_strangle, horror, blight, hot, burn, bleed<br>|
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
|m_IsKill|boolean|||
|m_IsLockedTeamPosition|boolean|||
|m_IsSourceOnly|boolean|||
|m_IsVisible|boolean|Default True||
|m_LootIds|List(LootTable&nbsp;ID)|||
|m_LootReasonId|Or(Item&nbsp;ID, ActOut&nbsp;ID, QuestStep&nbsp;ID)|||
|m_Move|integer|||
|m_MoveRange|integer|||
|m_Priority|integer|||
|m_QuirkAddAmount|integer|||
|m_QuirkAddAmountRange|integer|||
|m_QuirkAddTag|Quirk&nbsp;Tag-|||
|m_QuirkRemoveAmount|integer|||
|m_QuirkRemoveAmountRange|integer|||
|m_QuirkRemoveIsLocked|boolean|||
|m_QuirkRemoveTag|Quirk&nbsp;Tag-|||
|m_Release|boolean|||
|m_RunValuesIsSetTo|boolean|||
|m_ShowValue|boolean|||
|m_Shuffle|boolean|||
|m_SiegeAllDelayChange|integer|||
|m_SiegeAllStrengthChange|integer|||
|m_SiegeSpawnAmount|integer|||
|m_SiegeSpawnAmountRange|integer|||
|m_SortType|keyword||keyword: NAME, CLASS_NAME<br>|
|m_StageCoachUpgradeRemoveId|Item&nbsp;ID|||
|m_StressDamage|float|||
|m_StressDamageRange|float|||
|m_StressHeal|float|||
|m_StressHealDownFromMax|float|||
|m_SummonAddToTurnOrderAfterCurrentTurnIndex|integer|||
|m_SummonClassActorId|ActorDataClass&nbsp;ID|||
|m_SummonIfRoom|boolean|||
|m_SummonLocationType|keyword||keyword: FRONT, BACK, RANDOM<br>|
|m_TokenAddAmount|integer|||
|m_TokenAddAmountRange|integer|||
|m_TokenAddId|Token&nbsp;ID|||
|m_TokenAddTag|Token&nbsp;Tag-|||
|m_TokenConvertAmount|integer|||
|m_TokenConvertFromDotTags|List(Dot&nbsp;Tag-)|||
|m_TokenConvertFromTokenIds|List(Token&nbsp;ID)|||
|m_TokenConvertToId|Token&nbsp;ID|||
|m_TokenCopyAmount|integer|||
|m_TokenCopyTags|List(Token&nbsp;Tag-)|||
|m_TokenInvertAmount|integer|||
|m_TokenInvertAmountRange|integer|||
|m_TokenInvertIds|List(Token&nbsp;ID)|||
|m_TokenRemoveAmount|integer|||
|m_TokenRemoveId|Token&nbsp;ID|||
|m_TokenRemoveRandom|boolean|Default True||
|m_TokenRemoveTag|Token&nbsp;Tag-|||
|m_TokenStealAmount|integer|||
|m_TokenStealTags|List(Token&nbsp;Tag-)|||
|m_TreasureAllDurationChange|integer|||
|m_TreasureSpawnAmount|integer|||
|m_UnlockRemoveNonSkillAmount|integer|||
|m_UnlockRemoveNonSkillAmountRange|integer|||
|m_UnlockRemoveUpgradedSkillAmount|integer|||
|m_UnlockRemoveUpgradedSkillAmountRange|integer|||
|m_WoundAddPercent|float|||
|m_WoundRemovePercent|float|||
|quirks|List(Quirk&nbsp;ID)|||
|stage_coach_armor|integer|||
|stage_coach_wheels|integer|||
|torch|integer|||
</details>

<details>
<summary><b>ExtendedBoss</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|boss_modifiers|List(BossModifier&nbsp;ID)|||
|doom_reset_actorless_effects|List(Effect&nbsp;ID)|||
|doom_reset_hero_effects|List(Effect&nbsp;ID)|||
|m_AcademicsHonorariumLimit|integer|||
|m_EndBiomeType|keyword||keyword: Valley, ValleyIntro, ValleyKingdom, City, Farm, Forest, Coast, Tundra, Cave, Catacombs, MountainBrain, MountainLungs, MountainEyes, MountainArms, MountainBody, Invalid<br>|
|m_IntroNarrationId|NarrationEntry&nbsp;ID|||
|m_IsRunGoalGenerating|boolean|||
|m_OrderedMidNarrationIds|List(NarrationEntry&nbsp;ID)|||
|m_OutroNarrationId|NarrationEntry&nbsp;ID|||
|m_PrefabSubdirectoryId|keyword||keyword: Resentment, Denial<br>|
|m_RecurringMidNarrationIds|List(NarrationEntry&nbsp;ID)|||
|m_RequiredStageCoachItemSlotType|keyword||keyword: None, General, Trophy, Pet, Flame<br>|
|m_SelectBiomeType|keyword||keyword: Valley, ValleyIntro, ValleyKingdom, City, Farm, Forest, Coast, Tundra, Cave, Catacombs, MountainBrain, MountainLungs, MountainEyes, MountainArms, MountainBody, Invalid<br>|
|m_TorchLevelGroupId|TorchLevelGroup&nbsp;ID|||
</details>

<details>
<summary><b>Gang</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|escalation_torch_level_groups|List(TorchLevelGroup&nbsp;ID)|||
|m_BossBiomeType|keyword||keyword: Valley, ValleyIntro, ValleyKingdom, City, Farm, Forest, Coast, Tundra, Cave, Catacombs, MountainBrain, MountainLungs, MountainEyes, MountainArms, MountainBody, Invalid<br>|
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
|m_durationIds|HapticsDuration&nbsp;ID|||
|m_intensityIds|HapticsIntensity&nbsp;ID|||
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
|m_InnFeatureTypes|List(keyword)||keyword: actor_path_change, stage_coach_repair, stage_coach_change_skin, fast_travel, trainer, wainwright, remove_positive_quirk, lock_positive_quirk, remove_negative_quirk, remove_disease, physician, item_selling<br>|
|m_InnRunDataStatsIds|List(RunDataStats&nbsp;ID)|||
|m_InnStartBarkActorDataIds|List(ActorDataClass&nbsp;ID)|||
|m_InnUpgradeCategories|List(keyword)||keyword: defense, provisioner, wainwright, trainer, physician, kingdom_inn, kingdom_camp, stage_coach_inn, stage_coach_camp<br>|
|m_IsInnBonusValid|boolean|||
|m_LimitInnLevel|integer|||
|m_LimitInnUpgradeCategories|List(keyword)||keyword: defense, provisioner, wainwright, trainer, physician, kingdom_inn, kingdom_camp, stage_coach_inn, stage_coach_camp<br>|
|m_NextBiomeRunDataStatsIds|List(RunDataStats&nbsp;ID)|||
|m_NumberOfBiomeChoices|integer|||
|m_QuirkGenerationAmount|integer|||
|m_QuirkGenerationChance|float|||
|m_QuirkGenerationTags|List(Seq(Quirk&nbsp;Tag-, float))|||
|m_StoreLootTableIds|List(LootTable&nbsp;ID)|||
|m_Tags|List(Inn&nbsp;Tag+)|||
|m_TemporaryInnUpgradeCategories|List(keyword)||keyword: defense, provisioner, wainwright, trainer, physician, kingdom_inn, kingdom_camp, stage_coach_inn, stage_coach_camp<br>|
|m_WoundHealCostId|Cost&nbsp;ID|||
|run_value_transactions|List(RunValueTransaction&nbsp;ID)|||
</details>

<details>
<summary><b>InnBonus</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|actorless_effects|List(Effect&nbsp;ID)|||
|all_conditions|List(Condition&nbsp;ID)|||
|hero_effects|List(Condition&nbsp;ID)|||
|m_BonusLootTableIds|List(LootTable&nbsp;ID)|||
|m_DeliverableIcon|keyword||keyword: treasure, hero_bones<br>|
|m_InnRunDataStatsIds|RunDataStats&nbsp;ID|||
|m_IsBonusLootExclusive|boolean|||
|m_QuestResource|Quest&nbsp;ID|||
|m_Score|integer|||
</details>

<details>
<summary><b>InnDataStats</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|add_stat|Seq(keyword, float)||keyword: health_max, defense, repair_percent, upgrade_skill_limit, unlock_skill_limit, stage_coach_item_slot_equip_limit, siege_target_chance, siege_resolved_duration, siege_resolved_target_chance, physician_wound_heal_percentage, kingdom_wound_heal_percentage, storage_inventory_max_slots, infection_adjacent_cure_percentage<br>|
|sub_stat|Seq(keyword1, keyword2, float)||keyword1: health_max, defense, repair_percent, upgrade_skill_limit, unlock_skill_limit, stage_coach_item_slot_equip_limit, siege_target_chance, siege_resolved_duration, siege_resolved_target_chance, physician_wound_heal_percentage, kingdom_wound_heal_percentage, storage_inventory_max_slots, infection_adjacent_cure_percentage<br>keyword2: General, Pet, Trophy<br>|
</details>

<details>
<summary><b>InnTable</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|m_chances|List(float)|||
|m_ids|List(Inn&nbsp;ID)|||
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
|m_InnFeatureTypes|List(keyword)||keyword: actor_path_change, stage_coach_repair, stage_coach_change_skin, fast_travel, trainer, wainwright, remove_positive_quirk, lock_positive_quirk, remove_negative_quirk, remove_disease, physician, item_selling<br>|
|m_InnLevel|integer|||
|m_InnRunDataStatsIds|List(RunDataStats&nbsp;ID)|||
|m_InnUpgradeCategory|keyword||keyword: defense, provisioner, wainwright, trainer, physician, kingdom_inn, kingdom_camp, stage_coach_inn, stage_coach_camp<br>|
|m_InnUpgradeType|keyword||keyword: minor, major, ultimate, kingdom, stage_coach<br>|
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
|m_DurationType|keyword||keyword: performer_turn_start, performer_turn_end, every_turn_start, every_turn_end, round_start, round_end, combat_end, inn_start, inn_end, embark_start, embark_end, infinite, skill_calculate, skill_cooldown, token_calculate_damage, node, day<br>|
|m_InnUpgradeIds|List(InnUpgrade&nbsp;ID)|||
|m_IsStressTriggerBarking|boolean|||
|m_IsUnequipIfNotInParty|boolean|||
|m_IsUnequipInvalid|boolean|||
|m_OverrideBackgroundFileName|keyword||keyword: quest_coven, quest_courtier, quest_beastmen, cru_quest<br>|
|m_QuestResourceId|keyword||keyword: coven, courtier, beastmen<br>|
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
|m_slot|keyword||keyword: None, General, Trophy, Pet, Flame<br>|
|m_tags|List(Item&nbsp;Tag+)|||
|m_type|keyword||keyword: currency, rest, combat, trinket, stage_coach_upgrade, memory, memory_reroll<br>|
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
|m_TrinketEquipSfxOverrideEventPath|keyword||keyword: event:/ui/shared/trinket_equip_cultist<br>|
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
|m_RosterReplacementType|keyword||keyword: none, respawn, refill<br>|
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
|m_EffectRosterStatusTypes|keyword||keyword: idle, party, reserve, dead, load, captured, hire, hire_replaced, kingdom<br>|
|m_EventTypeRarity|keyword||keyword: RARE<br>|
|m_EventTypeRef|keyword||keyword: negative, coast, almanac_coast, farm, almanac_farm, almanac_forest, positive, wagonmaster, regent, warmaster, city, almanac_city, tundra, almanac_tundra, escalation, forest, forerunner<br>|
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
|m_chances|List(float)|||
|m_conditions|List(Condition&nbsp;ID)|||
|m_ids|List(Or(Item&nbsp;ID, LootTable&nbsp;ID))|||
|m_qtys|List(Or(integer, range))|||
|m_tags|List(LootTableEntry&nbsp;Tag+)|||
|m_types|List(keyword)||keyword: provision, item, sub_table, unique_sub_table, exclusive_sub_table, all_sub_table, nothing, profile_unlock, quest_step, biome_reward<br>|
|m_unlockId|Unlock&nbsp;ID|||
|undefined|Or(Item&nbsp;ID, ActOut&nbsp;ID, QuestStep&nbsp;ID)|||
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
|m_guaranteeType|keyword||keyword: profile_first, always, none<br>|
|m_maxOccurrences|integer|||
|m_numberOfPanels|integer|||
|m_occurrenceTypes|keyword||keyword: inn, biome, node, run, combat, profile<br>|
|m_type|NarrationType&nbsp;ID|||
</details>

<details>
<summary><b>NarrationType</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|m_chance|float|||
|m_disabledGameTypes|keyword||keyword: expedition, kingdom<br>|
|m_maxOccurrences|integer|||
|m_occurrenceTypes|keyword||keyword: inn, biome, node, run, combat, profile<br>|
</details>

<details>
<summary><b>NodeDeliverable</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|all_conditions|List(Condition&nbsp;ID)|||
|m_LootIds|List(LootTable&nbsp;ID)|||
|m_NodeType|keyword||keyword: Cache, Gate, Hospital, Inn, Store, WatchTower, StoryCultist, StoryCultistMountain01, StoryCultistMountain02, StoryAssist, StoryResist, StoryCosmic, StoryHero, StoryHeroReplacement, Dungeon, Guardian, CreatureDen, Oasis, HeroSelect, AltarOfHope, Bridge, GameResults, BossSelect, Landmark, Cathedral, Dummy, Mountain, LandmarkTreesDense, LandmarkTreesSparse, LandmarkInkfireField, Unknown, GauntChirurgeon, Warlord, BeastmenAlpha, KingdomInn, KingdomInnSieged, KingdomCamp, KingdomBoss, StoryAssistGang, CacheGang, BridgeGang, CovenAssist, null<br>|
|m_Tags|List(NodeDeliverable&nbsp;Tag+)|||
</details>

<details>
<summary><b>NodeReplacement</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|m_AdditionalEndNodeTypes|keyword||keyword: Cache, Gate, Hospital, Inn, Store, WatchTower, StoryCultist, StoryCultistMountain01, StoryCultistMountain02, StoryAssist, StoryResist, StoryCosmic, StoryHero, StoryHeroReplacement, Dungeon, Guardian, CreatureDen, Oasis, HeroSelect, AltarOfHope, Bridge, GameResults, BossSelect, Landmark, Cathedral, Dummy, Mountain, LandmarkTreesDense, LandmarkTreesSparse, LandmarkInkfireField, Unknown, GauntChirurgeon, Warlord, BeastmenAlpha, KingdomInn, KingdomInnSieged, KingdomCamp, KingdomBoss, StoryAssistGang, CacheGang, BridgeGang, CovenAssist, null<br>|
|m_AdditionalStartNodeTypes|keyword||keyword: Cache, Gate, Hospital, Inn, Store, WatchTower, StoryCultist, StoryCultistMountain01, StoryCultistMountain02, StoryAssist, StoryResist, StoryCosmic, StoryHero, StoryHeroReplacement, Dungeon, Guardian, CreatureDen, Oasis, HeroSelect, AltarOfHope, Bridge, GameResults, BossSelect, Landmark, Cathedral, Dummy, Mountain, LandmarkTreesDense, LandmarkTreesSparse, LandmarkInkfireField, Unknown, GauntChirurgeon, Warlord, BeastmenAlpha, KingdomInn, KingdomInnSieged, KingdomCamp, KingdomBoss, StoryAssistGang, CacheGang, BridgeGang, CovenAssist, null<br>|
|m_FromNodeType|keyword||keyword: Cache, Gate, Hospital, Inn, Store, WatchTower, StoryCultist, StoryCultistMountain01, StoryCultistMountain02, StoryAssist, StoryResist, StoryCosmic, StoryHero, StoryHeroReplacement, Dungeon, Guardian, CreatureDen, Oasis, HeroSelect, AltarOfHope, Bridge, GameResults, BossSelect, Landmark, Cathedral, Dummy, Mountain, LandmarkTreesDense, LandmarkTreesSparse, LandmarkInkfireField, Unknown, GauntChirurgeon, Warlord, BeastmenAlpha, KingdomInn, KingdomInnSieged, KingdomCamp, KingdomBoss, StoryAssistGang, CacheGang, BridgeGang, CovenAssist, null<br>|
|m_IsVisible|boolean|Default True||
|m_NodeExitBarkOverrideNodeTypes|keyword||keyword: Cache, Gate, Hospital, Inn, Store, WatchTower, StoryCultist, StoryCultistMountain01, StoryCultistMountain02, StoryAssist, StoryResist, StoryCosmic, StoryHero, StoryHeroReplacement, Dungeon, Guardian, CreatureDen, Oasis, HeroSelect, AltarOfHope, Bridge, GameResults, BossSelect, Landmark, Cathedral, Dummy, Mountain, LandmarkTreesDense, LandmarkTreesSparse, LandmarkInkfireField, Unknown, GauntChirurgeon, Warlord, BeastmenAlpha, KingdomInn, KingdomInnSieged, KingdomCamp, KingdomBoss, StoryAssistGang, CacheGang, BridgeGang, CovenAssist, null<br>|
|m_NodeExitBarkPreferredActorDataIds|List(ActorDataClass&nbsp;ID)|||
|m_ToNodeType|keyword||keyword: Cache, Gate, Hospital, Inn, Store, WatchTower, StoryCultist, StoryCultistMountain01, StoryCultistMountain02, StoryAssist, StoryResist, StoryCosmic, StoryHero, StoryHeroReplacement, Dungeon, Guardian, CreatureDen, Oasis, HeroSelect, AltarOfHope, Bridge, GameResults, BossSelect, Landmark, Cathedral, Dummy, Mountain, LandmarkTreesDense, LandmarkTreesSparse, LandmarkInkfireField, Unknown, GauntChirurgeon, Warlord, BeastmenAlpha, KingdomInn, KingdomInnSieged, KingdomCamp, KingdomBoss, StoryAssistGang, CacheGang, BridgeGang, CovenAssist, null<br>|
|m_ValidBiomeTypes|keyword||keyword: Valley, ValleyIntro, ValleyKingdom, City, Farm, Forest, Coast, Tundra, Cave, Catacombs, MountainBrain, MountainLungs, MountainEyes, MountainArms, MountainBody, Invalid<br>|
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
|m_QuestType|keyword||keyword: profile, game<br>|
|m_ValidGameTypes|keyword||keyword: expedition, kingdom<br>|
|on_completion_unlocks|List(Unlock&nbsp;ID)|||
|quest_steps|List(QuestStep&nbsp;ID)|||
</details>

<details>
<summary><b>QuestStep</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|m_DataNodeReplacementsId|DataNodeReplacements&nbsp;ID|||
|m_DisplayOverrideId|keyword||keyword: inn_combined, inn_exclusive, start<br>|
|m_InnLootIds|List(LootTable&nbsp;ID)|||
|m_IsKingdomTimelineValid|boolean|||
|m_QuestStepNumber|integer|||
|m_QuestStepString|Or(Item&nbsp;ID, InnBonus&nbsp;ID)|||
|m_QuestStepType|keyword||keyword: stage_coach_upgrade_equip, inn_bonus, loot<br>|
|m_SkipGuaranteedLootIds|List(LootTable&nbsp;ID)|||
</details>

<details>
<summary><b>Quirk</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|generation_all_conditions|List(Condition&nbsp;ID)|||
|m_DurationAmount|integer|||
|m_DurationType|keyword||keyword: performer_turn_start, performer_turn_end, every_turn_start, every_turn_end, round_start, round_end, combat_end, inn_start, inn_end, embark_start, embark_end, infinite, skill_calculate, skill_cooldown, token_calculate_damage, node, day<br>|
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
|m_ActorStatSubType|keyword||keyword: debuff, stress, blight, death, positivetoken, stun, burn, move, bleed, disease<br>|
|m_ActorStatType|keyword||keyword: <details><summary>expand</summary>speed, speed_tie_breaker, speed_number_of_turns, crit_chance, health_damage, health_damage_range, health_damage_dealt_percent, health_damage_dealt_mult_percent, health_damage_received_percent, health_max, wound_percent_max, stress_max, deaths_door_chance, resistance, resistance_ignore, health_heal_dealt_percent, health_heal_received_percent, health_heal_percent_between_nodes, route_choice_chance, route_choice_preference, dot_extra_duration_dealt, dot_extra_duration_received, dot_effect_value_dealt_change, dot_effect_value_received_change, dot_effect_value_dealt_multiplier, dot_effect_value_received_multiplier, affinity_relationship_tag_chance_modifier, affinity_relationship_tag_extra_duration, overstress_chance_modifier, inn_quirk_generation_chance_modifier, kingdom_actor_travel_distance, kingdom_actor_travel_effect_chance, kingdom_wound_heal_multiplier, rest_item_effect_chance_modifier, token_limit, effect_performer_chance_multiplier, effect_target_chance_multiplier</details><br>|
|m_BuffTags|List(Buff&nbsp;Tag-)|||
|m_CritMod|float|||
|m_DotTags|List(Dot&nbsp;Tag-)|||
|m_IgnoreActorStatType|keyword||keyword: <details><summary>expand</summary>speed, speed_tie_breaker, speed_number_of_turns, crit_chance, health_damage, health_damage_range, health_damage_dealt_percent, health_damage_dealt_mult_percent, health_damage_received_percent, health_max, wound_percent_max, stress_max, deaths_door_chance, resistance, resistance_ignore, health_heal_dealt_percent, health_heal_received_percent, health_heal_percent_between_nodes, route_choice_chance, route_choice_preference, dot_extra_duration_dealt, dot_extra_duration_received, dot_effect_value_dealt_change, dot_effect_value_received_change, dot_effect_value_dealt_multiplier, dot_effect_value_received_multiplier, affinity_relationship_tag_chance_modifier, affinity_relationship_tag_extra_duration, overstress_chance_modifier, inn_quirk_generation_chance_modifier, kingdom_actor_travel_distance, kingdom_actor_travel_effect_chance, kingdom_wound_heal_multiplier, rest_item_effect_chance_modifier, token_limit, effect_performer_chance_multiplier, effect_target_chance_multiplier</details><br>|
|m_IgnorePopTextSourceTypes|keyword||keyword: <details><summary>expand</summary>debug, combat, skill, skill_buff, skill_actor, dot, driving, death, status, story, act_out, inn, inn_upgrade, inn_bonus, stress, overstress, hospital, class, torch, relationship, party, quirk, disease, quirk_curse, trinket, stage_coach_general, stage_coach_trophy, stage_coach_pet, stage_coach_flame, stage_coach_armor, stage_coach_wheels, buff, store, inventory, retreat, stall, duration, affinity, token, route, route_choice, doom, run, run_goal, biome, biome_goal, biome_modifier, biome_status, biome_upgrade, locked_team_position_transfer, rest_item, effect, bark, path, boss, capture, arena, resist, memory, roster, node, quest, altar_of_hope, kingdom, kingdom_event, kingdom_treasure, escalation, wound, mode, siege</details><br>|
|m_IsDeath|boolean|||
|m_IsStress|boolean|||
|m_Max|float|Default float.MinValue||
|m_Min|float|Default float.maxValue||
|m_PositiveRunValueTypes|keyword||keyword: torch, hero_upgrade_points, doom, stage_coach_armor, stage_coach_wheels, escalation<br>|
|m_QuirkTags|List(Quirk&nbsp;Tag-)|||
|m_RunStatSubType|keyword||keyword: doom<br>|
|m_RunStatType|keyword||keyword: <details><summary>expand</summary>loot_chance, loot_qty, torch_min_value, torch_max_value, torch_default_value, torch_add_percent, torch_remove_percent, torch_drain_between_nodes, hero_upgrade_points_min_value, hero_upgrade_points_max_value, hero_upgrade_points_default_value, doom_min_value, doom_max_value, doom_default_value, doom_reset_value, doom_effect_number_of_nodes, stage_coach_armor_min_value, stage_coach_armor_max_value, stage_coach_armor_default_value, stage_coach_wheels_min_value, stage_coach_wheels_max_value, stage_coach_wheels_default_value, item_max_qty, item_discard_game_score_chance, player_inventory_max_slots, retreat_chance, scout_node_chance, scout_route_chance, store_cost_buy_multiplier, affinity_tick_trigger_positive_chance_multiplier, affinity_tick_trigger_negative_chance_multiplier, affinity_relationship_tag_chance_modifier, battle_modifier_chance, story_choice_multiplier, map_generation_nodes_per_row_min, map_generation_nodes_per_row_max, map_generation_nodes_per_row_multiplier, map_generation_length_multiplier, map_generation_node_spawn_multiplier, map_generation_node_execute_loot_chance, map_generation_node_filler_limit_modifier, map_generation_road_event_spawn_multiplier, map_generation_route_chance_multiplier, score_bonus_multiplier, score_penalty_multiplier, run_generation_number_of_typical_biomes, run_generation_typical_biome_chance, run_generation_number_of_optional_biomes, run_generation_optional_biome_chance, resistance, battle_configuration_chance, hire_typical_biomes_min, hire_typical_biomes_max, hire_chance, boss_modifier_chance_modifier, escalation_min_value, escalation_max_value, escalation_default_value, siege_accrual, siege_accrual_range, siege_spawn_threshold, siege_spawn_limit, siege_strength, siege_strength_range, siege_delay, siege_delay_range, treasure_accrual, treasure_accrual_range, treasure_spawn_threshold, kill_contract_accrual, kill_contract_accrual_range, kill_contract_spawn_threshold, kill_contract_spawn_limit, kingdom_event_generation_chance, camp_ambush_chance, route_effect_apply_multiplier</details><br>|
|m_SkillAttributes|keyword||keyword: health_damage, health_heal, wound_add, wound_remove, stress_damage, stress_heal, move, token_add, token_remove, token_convert, token_steal, token_copy, token_invert, dot_add, dot_remove, dot_steal, dot_copy, buff_add, buff_remove, quirk_add, quirk_remove, affinity_positive, affinity_negative, bark, capture, release, kill<br>|
|m_TokenIds|List(Token&nbsp;ID)|||
|m_TokenTags|List(Token&nbsp;Tag-)|||
</details>

<details>
<summary><b>RoadEvent</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|m_Chance|float|||
|m_RoadEventCategory|keyword||keyword: Objects, Banter, Ambush, Route, null<br>|
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
|m_RouteType|keyword||keyword: safe, rough_patch, hazard, combat, gang_combat, oblivion_tear, size<br>|
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
|m_LockQuirkByTagCosts|Seq(Quirk&nbsp;Tag-, integer)|||
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
|m_RemoveQuirkByTagCosts|Seq(Quirk&nbsp;Tag-, integer)|||
|m_RespawnStageCoachRefillRunValueTypes|keyword||keyword: torch, hero_upgrade_points, doom, stage_coach_armor, stage_coach_wheels, escalation<br>|
|m_RunDataStatsId|RunDataStats&nbsp;ID|||
|m_SellExecutingNodeTypes|List(keyword)||keyword: Cache, Gate, Hospital, Inn, Store, WatchTower, StoryCultist, StoryCultistMountain01, StoryCultistMountain02, StoryAssist, StoryResist, StoryCosmic, StoryHero, StoryHeroReplacement, Dungeon, Guardian, CreatureDen, Oasis, HeroSelect, AltarOfHope, Bridge, GameResults, BossSelect, Landmark, Cathedral, Dummy, Mountain, LandmarkTreesDense, LandmarkTreesSparse, LandmarkInkfireField, Unknown, GauntChirurgeon, Warlord, BeastmenAlpha, KingdomInn, KingdomInnSieged, KingdomCamp, KingdomBoss, StoryAssistGang, CacheGang, BridgeGang, CovenAssist, null<br>|
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
|m_SkipValleyRunValues|Seq(keyword, float)||keyword: torch<br>|
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
|repeatable_item|Seq(keyword, LootTable&nbsp;ID, List(Cost&nbsp;ID))||keyword: trinket, combat, stage_coach_upgrade, rest, memory_reroll<br>|
|reroll_quirks_costs|List(Cost&nbsp;ID)|||
|retreat_effects|List(Effect&nbsp;ID)|||
|retreat_per_hero_effects|List(Effect&nbsp;ID)|||
|retreat_single_hero_effects|List(Effect&nbsp;ID)|||
|route_choice_unwanted_effects|List(Effect&nbsp;ID)|||
|route_choice_wanted_effects|List(Effect&nbsp;ID)|||
|score_multiplier|Seq(keyword, float)||keyword: leagues_passed, start_biomes_cleared, academics_honorarium, typical_biomes_cleared, optional_biomes_cleared, hero_stories_cleared, fights_won, biome_bosses_cleared, inventory_items, items_discarded, run_goals_path, run_goals_class, faced_end_boss, first_end_boss_victory, victory, heroes_survived, heroes_hired, inn_bonus<br>|
|score_replacement|Seq(keyword, List(integer))||keyword: leagues_passed, start_biomes_cleared, academics_honorarium, typical_biomes_cleared, optional_biomes_cleared, hero_stories_cleared, fights_won, biome_bosses_cleared, inventory_items, items_discarded, run_goals_path, run_goals_class, faced_end_boss, first_end_boss_victory, victory, heroes_survived, heroes_hired, inn_bonus<br>|
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
|add_stat|Seq(keyword, float)||keyword: <details><summary>expand</summary>loot_chance, loot_qty, torch_min_value, torch_max_value, torch_default_value, torch_add_percent, torch_remove_percent, torch_drain_between_nodes, hero_upgrade_points_min_value, hero_upgrade_points_max_value, hero_upgrade_points_default_value, doom_min_value, doom_max_value, doom_default_value, doom_reset_value, doom_effect_number_of_nodes, stage_coach_armor_min_value, stage_coach_armor_max_value, stage_coach_armor_default_value, stage_coach_wheels_min_value, stage_coach_wheels_max_value, stage_coach_wheels_default_value, item_max_qty, item_discard_game_score_chance, player_inventory_max_slots, retreat_chance, scout_node_chance, scout_route_chance, store_cost_buy_multiplier, affinity_tick_trigger_positive_chance_multiplier, affinity_tick_trigger_negative_chance_multiplier, affinity_relationship_tag_chance_modifier, battle_modifier_chance, story_choice_multiplier, map_generation_nodes_per_row_min, map_generation_nodes_per_row_max, map_generation_nodes_per_row_multiplier, map_generation_length_multiplier, map_generation_node_spawn_multiplier, map_generation_node_execute_loot_chance, map_generation_node_filler_limit_modifier, map_generation_road_event_spawn_multiplier, map_generation_route_chance_multiplier, score_bonus_multiplier, score_penalty_multiplier, run_generation_number_of_typical_biomes, run_generation_typical_biome_chance, run_generation_number_of_optional_biomes, run_generation_optional_biome_chance, resistance, battle_configuration_chance, hire_typical_biomes_min, hire_typical_biomes_max, hire_chance, boss_modifier_chance_modifier, escalation_min_value, escalation_max_value, escalation_default_value, siege_accrual, siege_accrual_range, siege_spawn_threshold, siege_spawn_limit, siege_strength, siege_strength_range, siege_delay, siege_delay_range, treasure_accrual, treasure_accrual_range, treasure_spawn_threshold, kill_contract_accrual, kill_contract_accrual_range, kill_contract_spawn_threshold, kill_contract_spawn_limit, kingdom_event_generation_chance, camp_ambush_chance, route_effect_apply_multiplier</details><br>|
|add_stats|List(float)|||
|key_map|List(keyword)||keyword: <details><summary>expand</summary>loot_chance, loot_qty, torch_min_value, torch_max_value, torch_default_value, torch_add_percent, torch_remove_percent, torch_drain_between_nodes, hero_upgrade_points_min_value, hero_upgrade_points_max_value, hero_upgrade_points_default_value, doom_min_value, doom_max_value, doom_default_value, doom_reset_value, doom_effect_number_of_nodes, stage_coach_armor_min_value, stage_coach_armor_max_value, stage_coach_armor_default_value, stage_coach_wheels_min_value, stage_coach_wheels_max_value, stage_coach_wheels_default_value, item_max_qty, item_discard_game_score_chance, player_inventory_max_slots, retreat_chance, scout_node_chance, scout_route_chance, store_cost_buy_multiplier, affinity_tick_trigger_positive_chance_multiplier, affinity_tick_trigger_negative_chance_multiplier, affinity_relationship_tag_chance_modifier, battle_modifier_chance, story_choice_multiplier, map_generation_nodes_per_row_min, map_generation_nodes_per_row_max, map_generation_nodes_per_row_multiplier, map_generation_length_multiplier, map_generation_node_spawn_multiplier, map_generation_node_execute_loot_chance, map_generation_node_filler_limit_modifier, map_generation_road_event_spawn_multiplier, map_generation_route_chance_multiplier, score_bonus_multiplier, score_penalty_multiplier, run_generation_number_of_typical_biomes, run_generation_typical_biome_chance, run_generation_number_of_optional_biomes, run_generation_optional_biome_chance, resistance, battle_configuration_chance, hire_typical_biomes_min, hire_typical_biomes_max, hire_chance, boss_modifier_chance_modifier, escalation_min_value, escalation_max_value, escalation_default_value, siege_accrual, siege_accrual_range, siege_spawn_threshold, siege_spawn_limit, siege_strength, siege_strength_range, siege_delay, siege_delay_range, treasure_accrual, treasure_accrual_range, treasure_spawn_threshold, kill_contract_accrual, kill_contract_accrual_range, kill_contract_spawn_threshold, kill_contract_spawn_limit, kingdom_event_generation_chance, camp_ambush_chance, route_effect_apply_multiplier</details><br>|
|multiply_stat|Seq(keyword, float)||keyword: <details><summary>expand</summary>loot_chance, loot_qty, torch_min_value, torch_max_value, torch_default_value, torch_add_percent, torch_remove_percent, torch_drain_between_nodes, hero_upgrade_points_min_value, hero_upgrade_points_max_value, hero_upgrade_points_default_value, doom_min_value, doom_max_value, doom_default_value, doom_reset_value, doom_effect_number_of_nodes, stage_coach_armor_min_value, stage_coach_armor_max_value, stage_coach_armor_default_value, stage_coach_wheels_min_value, stage_coach_wheels_max_value, stage_coach_wheels_default_value, item_max_qty, item_discard_game_score_chance, player_inventory_max_slots, retreat_chance, scout_node_chance, scout_route_chance, store_cost_buy_multiplier, affinity_tick_trigger_positive_chance_multiplier, affinity_tick_trigger_negative_chance_multiplier, affinity_relationship_tag_chance_modifier, battle_modifier_chance, story_choice_multiplier, map_generation_nodes_per_row_min, map_generation_nodes_per_row_max, map_generation_nodes_per_row_multiplier, map_generation_length_multiplier, map_generation_node_spawn_multiplier, map_generation_node_execute_loot_chance, map_generation_node_filler_limit_modifier, map_generation_road_event_spawn_multiplier, map_generation_route_chance_multiplier, score_bonus_multiplier, score_penalty_multiplier, run_generation_number_of_typical_biomes, run_generation_typical_biome_chance, run_generation_number_of_optional_biomes, run_generation_optional_biome_chance, resistance, battle_configuration_chance, hire_typical_biomes_min, hire_typical_biomes_max, hire_chance, boss_modifier_chance_modifier, escalation_min_value, escalation_max_value, escalation_default_value, siege_accrual, siege_accrual_range, siege_spawn_threshold, siege_spawn_limit, siege_strength, siege_strength_range, siege_delay, siege_delay_range, treasure_accrual, treasure_accrual_range, treasure_spawn_threshold, kill_contract_accrual, kill_contract_accrual_range, kill_contract_spawn_threshold, kill_contract_spawn_limit, kingdom_event_generation_chance, camp_ambush_chance, route_effect_apply_multiplier</details><br>|
|multiply_stats|List(float)|||
|sub_stat|Seq(keyword1, Or(LootTable&nbsp;Tag-, keyword2, keyword3, BattleConfigurationTable&nbsp;Tag-, Item&nbsp;ID), float)||keyword1: <details><summary>expand</summary>loot_chance, loot_qty, torch_min_value, torch_max_value, torch_default_value, torch_add_percent, torch_remove_percent, torch_drain_between_nodes, hero_upgrade_points_min_value, hero_upgrade_points_max_value, hero_upgrade_points_default_value, doom_min_value, doom_max_value, doom_default_value, doom_reset_value, doom_effect_number_of_nodes, stage_coach_armor_min_value, stage_coach_armor_max_value, stage_coach_armor_default_value, stage_coach_wheels_min_value, stage_coach_wheels_max_value, stage_coach_wheels_default_value, item_max_qty, item_discard_game_score_chance, player_inventory_max_slots, retreat_chance, scout_node_chance, scout_route_chance, store_cost_buy_multiplier, affinity_tick_trigger_positive_chance_multiplier, affinity_tick_trigger_negative_chance_multiplier, affinity_relationship_tag_chance_modifier, battle_modifier_chance, story_choice_multiplier, map_generation_nodes_per_row_min, map_generation_nodes_per_row_max, map_generation_nodes_per_row_multiplier, map_generation_length_multiplier, map_generation_node_spawn_multiplier, map_generation_node_execute_loot_chance, map_generation_node_filler_limit_modifier, map_generation_road_event_spawn_multiplier, map_generation_route_chance_multiplier, score_bonus_multiplier, score_penalty_multiplier, run_generation_number_of_typical_biomes, run_generation_typical_biome_chance, run_generation_number_of_optional_biomes, run_generation_optional_biome_chance, resistance, battle_configuration_chance, hire_typical_biomes_min, hire_typical_biomes_max, hire_chance, boss_modifier_chance_modifier, escalation_min_value, escalation_max_value, escalation_default_value, siege_accrual, siege_accrual_range, siege_spawn_threshold, siege_spawn_limit, siege_strength, siege_strength_range, siege_delay, siege_delay_range, treasure_accrual, treasure_accrual_range, treasure_spawn_threshold, kill_contract_accrual, kill_contract_accrual_range, kill_contract_spawn_threshold, kill_contract_spawn_limit, kingdom_event_generation_chance, camp_ambush_chance, route_effect_apply_multiplier</details><br>keyword2: Cache, Gate, Hospital, Inn, Store, WatchTower, StoryCultist, StoryCultistMountain01, StoryCultistMountain02, StoryAssist, StoryResist, StoryCosmic, StoryHero, StoryHeroReplacement, Dungeon, Guardian, CreatureDen, Oasis, HeroSelect, AltarOfHope, Bridge, GameResults, BossSelect, Landmark, Cathedral, Dummy, Mountain, LandmarkTreesDense, LandmarkTreesSparse, LandmarkInkfireField, Unknown, GauntChirurgeon, Warlord, BeastmenAlpha, KingdomInn, KingdomInnSieged, KingdomCamp, KingdomBoss, StoryAssistGang, CacheGang, BridgeGang, CovenAssist, null<br>keyword3: safe, rough_patch, hazard, combat, gang_combat, oblivion_tear, size<br>|
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
|m_GoalTooltipLocKeyOverride|Localization|||
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
|m_RunValueType|keyword||keyword: torch, hero_upgrade_points, doom, stage_coach_armor, stage_coach_wheels, escalation<br>|
|m_Tags|List(ActorDataClass&nbsp;Tag-)|||
</details>

<details>
<summary><b>RunValueTransaction</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|m_RunValueType|keyword||keyword: torch, hero_upgrade_points, doom, stage_coach_armor, stage_coach_wheels, escalation<br>|
|m_StoreCostMultiplierId|keyword||keyword: inn_wainwright<br>|
|m_TransactionAmount|float|||
|m_isDiscounted|boolean|||
</details>

<details>
<summary><b>SkillBlock</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|effect_skill_attribute_tags|List(keyword)||keyword: stealth, taproot_tangle_c, horror, health_heal, dot_add, immobilize, dodge, enrage, vulnerable, bark, block, strength, weak, stress_heal, move, token_add<br>|
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
|m_EnemyStoryChoicePreviewIds|List(keyword)||keyword: icon_story_token_daze_Preview, icon_story_token_vulnerable_Preview, icon_story_token_strength_Preview, icon_move_Preview, icon_blight_Preview, icon_story_token_combo_Preview, icon_debuff_Preview, icon_story_token_blind-line_Preview<br>|
|m_EnemyStoryChoicePreviewShowNumbers|List(boolean)|||
|m_EnemyStoryChoicePreviewValues|List(integer)|||
|m_ExclusiveTags||||
|m_PlayerStoryChoicePreviewIds|List(keyword)||keyword: <details><summary>expand</summary>icon_story_candle_loot_Preview, icon_story_coven_Preview, icon_story_quirk_negative_Preview, icon_story_wine_Preview, icon_story_team_token_crit_Preview, icon_story_token_speed_Preview, icon_story_scouting_Preview, icon_story_quirk_positive_Preview, icon_story_combat_item_loot_Preview, icon_story_materials_Preview, icon_story_team_stress_heal_Preview, icon_story_combat_Preview, icon_story_relic_large_Preview, icon_story_team_token_strength_Preview, icon_story_mystery_treasure_loot_Preview, icon_buff_Preview, icon_story_treasure_large, icon_story_coach_upgrade_loot_Preview, icon_story_trinket_loot_Preview, icon_story_rest_loot_Preview, icon_story_signature_inn_loot_Preview, icon_story_quirk_mixed_Preview, icon_story_ancestor_Preview, icon_story_token_weak_Preview, icon_story_team_token_dodge+_Preview, icon_story_food_loot_Preview, icon_story_food_large_Preview, icon_story_avoid_Preview, icon_story_token_stealth_Preview, icon_story_token_vulnerable_Preview, icon_story_token_strength_Preview, icon_story_stress_heal_Preview, icon_story_team_token_block_Preview, icon_story_armor_Preview, icon_story_books_Preview, icon_story_token_crit_Preview, icon_story_stress_mixed_Preview, icon_story_supplies_med_Preview, icon_story_relic_loot_Preview, icon_story_team_buff_Preview, icon_story_token_daze_Preview, icon_story_token_taunt_Preview, icon_story_stress_dmg_Preview, icon_story_buff_Preview, icon_story_supplies_small_Preview, icon_story_torch_Preview, icon_story_team_health_heal_Preview, icon_story_courtier_Preview, icon_story_wheel_Preview, icon_story_health_heal_Preview, icon_story_food_med_Preview, icon_story_token_block_Preview</details><br>|
|m_PlayerStoryChoicePreviewShowNumbers|List(boolean)|||
|m_PlayerStoryChoicePreviewValues|List(integer)|||
|m_ProgressGroupId|keyword||keyword: dlc_story, base_story, dlc_cosmetic, base_item, base_cosmetic, base, dlc<br>|
|m_ResultActorClassId|ActorDataClass&nbsp;ID|||
|m_ResultAudioOverrideId|keyword||keyword: caretaker, coven<br>|
|m_ResultBattleConfigurationId|BattleConfiguration&nbsp;ID|||
|m_ResultBattleConfigurationTableId|BattleConfigurationTable&nbsp;ID|||
|m_ResultLootIds|List(LootTable&nbsp;ID)|||
|m_ResultType|keyword||keyword: NONE, GAME_OBJECT, FOUND_BONE, MISSING_BONE, HIDDEN, UI<br>|
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
|m_FilterId|keyword||keyword: hazard, Objects, safe, rough_patch<br>|
|m_QueueFailedPresentationChance|float|||
|m_RoleType|keyword||keyword: PERFORMER, TARGET, OBSERVING_PERFORMER, OBSERVING_TARGET, PARTY<br>|
|m_Stress|float|||
|m_TriggerLimit|integer|||
|m_Type|keyword||keyword: crit, deaths_door, death, pet_inspect, node_path_taken, road_event_completed<br>|
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
|m_LocationType|keyword||keyword: FRONT, BACK, RANDOM<br>|
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
|m_ConsumeTypes|keyword||keyword: manual, crit, evade, block_move, turn, skill_buff, skill_calculate_damage_buff, skill_damage_buff, round_start_buff, round_end_buff, skill_effect, skill_token_ignore, extra_launch, extra_target, skip_turn, forced_target, block_stress_damage, delay_turn, stealth, guard, guarding, riposte, block_dot_apply, passive, on_damaging_blocked, on_damaging_hit, on_damaging_miss, on_non_damaging_miss, on_non_damaging_hit, on_killed, deaths_door_armor<br>|
|m_DurationAmount|integer|||
|m_DurationIsSingleRemove|boolean|||
|m_DurationType|keyword||keyword: performer_turn_start, performer_turn_end, every_turn_start, every_turn_end, round_start, round_end, combat_end, inn_start, inn_end, embark_start, embark_end, infinite, skill_calculate, skill_cooldown, token_calculate_damage, node, day<br>|
|m_InvertTokenId|Token&nbsp;ID|||
|m_IsExclusiveSource|boolean|||
|m_IsHidden|boolean|||
|m_IsPerformer|boolean|||
|m_IsRankToken|boolean|Adds a square bracket indicator under this token's icon, doesn't have gameplay effects||
|m_IsRemovedOnSourceCapture|boolean|||
|m_IsRemovedOnSourceDeath|boolean|||
|m_IsTarget|boolean|||
|m_Limit|integer|||
|m_NegateAllIds|List(Token&nbsp;ID)|||
|m_NegateIds|List(Token&nbsp;ID)|||
|m_PreviewValidStatuses|List(keyword)||keyword: deaths_door<br>|
|m_RemoveTypes|List(keyword)||keyword: manual, crit, evade, block_move, turn, skill_buff, skill_calculate_damage_buff, skill_damage_buff, round_start_buff, round_end_buff, skill_effect, skill_token_ignore, extra_launch, extra_target, skip_turn, forced_target, block_stress_damage, delay_turn, stealth, guard, guarding, riposte, block_dot_apply, passive, on_damaging_blocked, on_damaging_hit, on_damaging_miss, on_non_damaging_miss, on_non_damaging_hit, on_killed, deaths_door_armor<br>|
|m_ShowCombatDuration|boolean|Default True||
|m_ShowConsumePopText|boolean|Default True||
|m_ShowDescription|boolean|Default True||
|m_ShowName|boolean|Default True||
|m_Tags|List(Token&nbsp;Tag+)|||
|m_TeamLimit|integer|||
|m_TokenGlossaryAlwaysDisplay|boolean|||
|m_TokenGlossaryBiomeTag|Biome&nbsp;Tag-|||
|m_TokenGlossaryHeroTag|ActorDataClass&nbsp;Tag-|||
|m_TokenGlossaryPathTag|List(Or(ActorDataPath&nbsp;Tag-, ActorDataPath&nbsp;ID))|||
|m_TokenGlossaryTagDisplay|List(BattleConfiguration&nbsp;Tag-)|||
|remove_any_conditions|List(Condition&nbsp;ID)|||
|replace|Seq(Token&nbsp;ID, keyword, Token&nbsp;ID)||keyword: WITH<br>|
</details>

<details>
<summary><b>TokenIgnore</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|all_conditions|List(Condition&nbsp;ID)|||
|any_conditions|List(Condition&nbsp;ID)|||
|m_IgnoredTokenIds|List(Token&nbsp;ID)|||
|m_IgnoredTokenTypes|List(keyword)||keyword: manual, crit, evade, block_move, turn, skill_buff, skill_calculate_damage_buff, skill_damage_buff, round_start_buff, round_end_buff, skill_effect, skill_token_ignore, extra_launch, extra_target, skip_turn, forced_target, block_stress_damage, delay_turn, stealth, guard, guarding, riposte, block_dot_apply, passive, on_damaging_blocked, on_damaging_hit, on_damaging_miss, on_non_damaging_miss, on_non_damaging_hit, on_killed, deaths_door_armor<br>|
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
|m_Type|keyword||keyword: CRIT, DEATHS_DOOR, DEATH, RELATIONSHIP<br>|
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
|cost|Seq(Cost&nbsp;ID, float, float)|Sets cost depending on unlock progress||
|m_ProgressGroupId|keyword||keyword: dlc_story, base_story, dlc_cosmetic, base_item, base_cosmetic, base, dlc<br>|
|m_chances|List(float)|||
|m_ids|List(Unlock&nbsp;ID)|||
|m_types|List(keyword)||keyword: unlock<br>|
</details>

<details>
<summary><b>UnlockTrack</b></summary>

| Field Name | Input Type | Comment | Values |
| ---------- | ---------- | ------- | ------ |
|m_ProgressGroupId|keyword||keyword: dlc_story, base_story, dlc_cosmetic, base_item, base_cosmetic, base, dlc<br>|
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
|m_Type|keyword||keyword: deaths_door, kingdom_actor_transfer, health_damage, inn_start, overstress<br>|
|m_WoundPercentChange|float|||
|m_WoundPercentMax|float|Default float.MaxValue||
</details>
