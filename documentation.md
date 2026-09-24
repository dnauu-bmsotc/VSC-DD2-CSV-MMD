
## Extension Documentation

### Data description

Description of CSV data is stored in `./CSV Description` directory in LibreOffice Calc files.

### Main process

On startup:
1. The extension reads contents of the VSCode project and Excel directories from the Darkest Dungeon II installation folder.
   Excel directories can be configured in extension's settings.
2. Each file is parsed into a list of elements, fields, values by commas. The `+` separator is not processed yet.
   After this step the extension has a list of files and what elements are stored in each file.
   Exact positions of fields and values in text are also stored.
3. Then each element is analyzed for IDs and tags.
   A separate storage is created for tag/id symbols and their references and what elements they belong to.
   It allows to track connections between elements.
4. With IDs and tags indexed, validation of elements becomes possible.
   During this step diagnostics are created and value types are clarified (`Dep`, `List` and other types are converted to more primitive types).
   Certain types cannot be reduced to primitive values, for example:
	- Unions: `m_TokenGlossaryHeroTag` field, despite its name, accepts hero tags or hero IDs. If provided value matches to both tag and ID, union cannot be reduced.
	- Plus-separated values: one value string contains multiple values.
   These values are stored along with primitive values. Hover hint and semantic token managers resolve them on their own.

On text change:
1. Old and new texts are compared, all elements in the changed region are reparsed and the old element data is replaced.
2. Before replacing old elements, the extension tracks what ID and tag definitions they have, and what other elements depend on these definitions so they can be revalidated.
3. New elements are indexed, and their connections to existing elements are tracked so affected elements can be revalidated.

### File scopes

This extension tries to process Overrides by defining file scopes. There are no scopes defined by the game, each overrides just happen in the order in which they are met. Later overrides replace previously gathered data. But the extension needs to keep track of all elements in all game modes. So each file has one of these scopes assigned:
- General: e.g. files in the top folder of the mod.
- Expedition: `expedition` folder.
- Kingdom: `kingdom` folder.
- GeneralOverride: top level of the `Overrides` folder.
- ExpeditionOverride: `Overrides/expedition` folder.
- KingdomOverride: `Overrides/kingdom` folder.

Each scope has applicable Game Modes:
- General/GeneralOverride: both Expeditions and Kingdoms Game Modes.
- Expedition/ExpeditionOverride: only Expeditions Game Mode.
- Kingdom/KingdomOverride: only Kingdoms Game Mode.

When the extension finds multiple elements with the same type, ID, and Game Mode, and they are not addable, it looks at the scopes of their respective files where they are defined.

If all these elements have the same file scope, the extension shows a warning about them not being addable.

If these elements have different scopes, then the extension filters out overridden elements:
- If elements are applicable for Expedition: General scope is overridden by Expedition scope which is overridden by a pair of (GeneralOverride and ExpeditionOverride).
- Similar process if elements are applicable for Kingdoms.

"Expedition scope which is overridden by a pair" means that both GeneralOverride and ExpeditionOverride can override the Expedition scope, but they can not override each other. So a mod cannot override its own elements. I made it this way because it looks like the game processes mod files in a different order than the official files: for the official files, the game gathers Game Mode-specific files last, so they override everything previously gathered; and for the mod files, the game gathers Game Mode-specific files second to last, the actual last mod files to gather are files in DLC-related folders. Also all files in the Overrides folders are able to overwrite any previously gathered data, what will be overwritten depends on the load order. I didn't know what to do about it, so instead mod files cannot override mod files.
