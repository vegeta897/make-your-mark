# Make Your Mark
You guessed it, a multiplayer web game. This might be doomed but who cares anymore?

## Concepts/Ideas

- Players spawn in a randomly generated world full of objects
- Move around and interact/gather objects
- Deltas stored on firebase
- ~~Goal of game is to leave evidence of your existence (marks) in the game world~~
- ~~More complicated "marks" require more complex interactions involving more objects~~
  - ~~That includes objects in inventory, and objects nearby (chain reactions?)~~
- ~~Player lives should be finite~~
  - ~~Need to keep making marks or you die~~
  - No users/registration, persistence is done through localstorage
- De-incentive to picking up everything you can find
  - ~~More stuff carried = die faster?~~
  - Inventory space/weight limits
- Making marks causes surrounding ground area to colorize to player's color
  - Better marks cause further/stronger spread
- Players can set up "traps" that may have ill-effects on other players
- Players can get bikes/skateboards to move faster
- Item durability, eg. scissors eventually wear down/break
- Player skill system
  - Use less durability when skilled with an item
  - ~~Yield more product when crafting certain things?~~
  - ~~Chance to create some special item when crafting?~~
- **Add Item quality levels with colored names/icons**
  - Wrapped presents and chests that contain a random high quality item
- Instanced player worlds so that one player doesn't dominate the server?
  - ~~Players can explore an instance together (created specifically for their combination of player IDs)~~
    - ~~Offers better loot?~~
    - ~~Need a way to fairly divide loot when 2+ players are exploring~~
- Buddy cam system?

### Metagame ideas

- Theft? AI guards with deterministic routines based on global tick?
- Something on a sector by sector basis?
- **Each player has a shop that they stock with items found in the map**
  - ~~Eventually going to other player's shops will be more viable than exploring~~
- Gambler shop
- Goal of building the ultimate collection?
  - View collection with silhouettes for things you don't have
  
### New movement/interact system

- Right click move, right click on an item to pick it up when you stop moving on it
- Left click to use/attack in a direction
  - Use/attack straight down if standing on something not picked up
  - Attacks are based on what is equipped
    - Different equip slots, like cutting tool, stabbing tool, bashing tool, writing tool, etc
  - Monsters to attack?
- Most items are hidden in containers (chests, bags, presents, buried)
  - ~~Player attacks/uses containers to lower their health until opened~~
    - ~~Damage to container is based on item used to attack type and container type~~
      - ~~Best attack for container type is chosen from items in toolbelt~~
      - ~~Attacks have a cooldown, per attack and per item~~
      - Number keys to manually select an attack
      - Tilde to revert to auto-choose
      - Can disable specific abilities to not be auto-chosen
    - ~~Attacked containers are busted open and have the broken sprite~~
    - ~~Player can gain specific container opening skills to open them cleanly~~
      - ~~Chance of success is based on amount of power saved up in that skill~~
        - ~~Power is drained to 0 when skill is used, regenerates slowly over time~~
      - ~~Player can do something with a cleanly opened container? Collect them?~~
      - ~~Opening containers forcefully gives XP toward earning skill or next level of skill for that container type~~
    - Quality of items within based on container tier
    - Make it juicy!
    - ~~Health stored on firebase as time of last hit and health at last hit (current health calculated client-side)~~
    - ~~Opened containers store on firebase as time opened, will respawn eventually~~
  - Dropped items have time dropped stored, will decay eventually
  - Resource mines that players can mine raw material from (aluminum, rubber, wood, etc)
    - Raw material can be used to craft items?
    - Raw material can be used for a chance to upgrade items?
      - More material = higher chance of success
    - Raw material can be used to repair items?

### Ambient AI

- Little creatures that idle around containers, attack container when player does

### New Game Concept

- Each container represents a "dungeon" that the player enters and fights through
  - Items appropriate for that container will help greatly
  - Dungeon itself is same 15x15 iso view, but different colors and of course layout
  - Failed dungeon will break container, beating it will open
  - What kind of enemies?