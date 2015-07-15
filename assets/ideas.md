# Make Your Mark #

- Players spawn in a randomly generated world full of objects
- Move around and interact/gather objects
- Deltas stored on firebase
- ~~Goal of game is to leave evidence of your existence (marks) in the game world~~
- More complicated "marks" require more complex interactions involving more objects
  - That includes objects in inventory, and objects nearby (chain reactions?)
- Player lives should be finite
  - ~~Need to keep making marks or you die~~
  - No users/registration, persistence is done through localstorage
- De-incentive to picking up everything you can find
  - ~~More stuff carried = die faster?~~
  - Inventory space/weight limits
  - When you die, all your carried stuff goes back to original spots?
- Persistent "recipe" learning system that makes it easier to do things you've already done
- Making marks causes surrounding ground area to colorize to player's color
  - Better marks cause further/stronger spread
- Players can set up "traps" that may have ill-effects on other players
- Players can get bikes/skateboards to move faster
- Item durability, eg. scissors eventually wear down/break
- Player skill system
  - Use less durability when skilled with an item
  - Yield more product when crafting certain things?
  - Chance to create some special item when crafting?
- **Add Item quality levels with colored names/icons**
  - Wrapped presents and chests that contain a random high quality item

Metagame ideas:

- Theft? AI guards with deterministic routines based on global tick?
- Something on a sector by sector basis?
- **Each player has a shop that they stock with items found in the map**
  - Eventually going to other player's shops will be more viable than exploring