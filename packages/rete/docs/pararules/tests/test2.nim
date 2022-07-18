import unittest
import pararules
import sets, random

randomize()

# these tests are for the readme

type
  Id = enum
    Global, Player, Derived,
  Attr = enum
    DeltaTime, TotalTime,
    X, Y,
    WindowWidth, WindowHeight,
    PressedKeys,
    Width, Height,
    XVelocity, YVelocity,
    XChange, YChange,
    AllCharacters,
  IntSet = HashSet[int]
  Characters = seq[tuple[id: int, x: float, y: float]]

schema Fact(Id, Attr):
  DeltaTime: float
  TotalTime: float
  X: float
  Y: float
  WindowWidth: int
  WindowHeight: int
  PressedKeys: IntSet
  Width: float
  Height: float
  XVelocity: float
  YVelocity: float
  XChange: float
  YChange: float
  AllCharacters: Characters

proc `==`(a: int, b: Id): bool =
  a == b.ord

test "your first rule":
  # create rule
  let rule1 =
    rule movePlayer(Fact):
      what:
        (Global, TotalTime, tt)
      then:
        discard #echo tt

  # create session and add rule
  var session = initSession(Fact)
  session.add(rule1)

  session.insert(Global, TotalTime, 0.5)

test "updating a session from inside a rule":
  let rule1 =
    rule movePlayer(Fact):
      what:
        (Global, TotalTime, tt)
      then:
        session.insert(Player, X, tt)

  var session = initSession(Fact)
  session.add(rule1)

  session.insert(Global, TotalTime, 0.5)

test "queries":
  let rule2 =
    rule getPlayer(Fact):
      what:
        (Player, X, x)
        (Player, Y, y)

  var session = initSession(Fact)
  session.add(rule2)

  session.insert(Player, X, 0.0)
  session.insert(Player, Y, 1.0)

  let results = session.queryAll(rule2)
  check results.len == 1

  let player = session.query(rule2)
  check player.x == 0.0
  check player.y == 1.0

  let index = session.find(rule2)
  check index >= 0

  let player2 = session.get(rule2, index)
  check player == player2

test "rulesets":
  let rules =
    ruleset:
      rule movePlayer(Fact):
        what:
          (Global, TotalTime, tt)
        then:
          session.insert(Player, X, tt)
      rule getPlayer(Fact):
        what:
          (Player, X, x)
          (Player, Y, y)

  var session = initSession(Fact)
  for r in rules.fields:
    session.add(r)

  session.insert(Player, X, 0.0)
  session.insert(Player, Y, 1.0)
  session.insert(Global, TotalTime, 0.5)

  check session.query(rules.getPlayer).x == 0.5

test "avoiding infinite loops":
  let rules =
    ruleset:
      rule movePlayer(Fact):
        what:
          (Global, DeltaTime, dt)
          (Player, X, x, then = false)
        then:
          session.insert(Player, X, x + dt)
      rule getPlayer(Fact):
        what:
          (Player, X, x)
          (Player, Y, y)

  var session = initSession(Fact)
  for r in rules.fields:
    session.add(r)

  session.insert(Player, X, 0.0)
  session.insert(Player, Y, 1.0)
  session.insert(Global, DeltaTime, 0.5)

  check session.query(rules.getPlayer).x == 0.5

test "conditions":
  let rules =
    ruleset:
      rule movePlayer(Fact):
        what:
          (Global, DeltaTime, dt)
          (Player, X, x, then = false)
        then:
          session.insert(Player, X, x + dt)
      rule getPlayer(Fact):
        what:
          (Player, X, x)
          (Player, Y, y)
      rule stopPlayer(Fact):
        what:
          (Global, WindowWidth, windowWidth)
          (Player, X, x)
        cond:
          x >= float(windowWidth)
          windowWidth > 0
        then:
          session.insert(Player, X, 0.0)

  var session = initSession(Fact)
  for r in rules.fields:
    session.add(r)

  session.insert(Player, X, 0.0)
  session.insert(Player, Y, 1.0)
  session.insert(Global, WindowWidth, 100)
  session.insert(Global, DeltaTime, 100.0)

  check session.query(rules.getPlayer).x == 0.0

test "complex types":
  let rules =
    ruleset:
      rule movePlayer(Fact):
        what:
          (Global, DeltaTime, dt)
          (Global, PressedKeys, keys, then = false)
          (Player, X, x, then = false)
        then:
          if keys.contains(263): # left arrow
            session.insert(Player, X, x - 1.0)
          elif keys.contains(262): # right arrow
            session.insert(Player, X, x + 1.0)
      rule getPlayer(Fact):
        what:
          (Player, X, x)
          (Player, Y, y)
      rule getKeys(Fact):
        what:
          (Global, PressedKeys, keys)
      rule stopPlayer(Fact):
        what:
          (Global, WindowWidth, windowWidth)
          (Player, X, x)
        cond:
          x >= float(windowWidth)
          windowWidth > 0
        then:
          session.insert(Player, X, 0.0)

  var session = initSession(Fact)
  for r in rules.fields:
    session.add(r)

  session.insert(Player, X, 0.0)
  session.insert(Player, Y, 1.0)
  session.insert(Global, WindowWidth, 100)
  session.insert(Global, DeltaTime, 100.0)
  var keys = initHashSet[int]()
  keys.incl(262)
  session.insert(Global, PressedKeys, keys)

  check session.query(rules.getPlayer).x == 1.0

test "joins and advanced queries":
  let rules =
    ruleset:
      rule getPlayer(Fact):
        what:
          (Player, X, x)
          (Player, Y, y)
      rule getCharacter(Fact):
        what:
          (id, X, x)
          (id, Y, y)
      rule stopPlayer(Fact):
        what:
          (Global, WindowWidth, windowWidth)
          (Player, X, x)
        cond:
          block:
            #echo x, " ", windowWidth
            x >= float(windowWidth)
          windowWidth > 0
        then:
          session.insert(Player, X, 0.0)

  var session = initSession(Fact)
  for r in rules.fields:
    session.add(r)

  session.insert(Global, WindowWidth, 100)
  session.insert(Player, X, 0.0)
  session.insert(Player, Y, 1.0)

  let ch = session.query(rules.getCharacter)
  check ch.id == Player
  check ch.x == 0.0
  check ch.y == 1.0

  let player = session.query(rules.getCharacter, id = Player)
  check player == ch

  let index = session.find(rules.getCharacter, id = Player)
  check index != -1

  let player2 = session.query(rules.getPlayer)
  check player2.x == 0.0
  check player2.y == 1.0

  let results = session.queryAll(rules.getCharacter)
  check results.len == 1

test "generating ids":
  let rule1 =
    rule getCharacter(Fact):
      what:
        (id, X, x)
        (id, Y, y)
      cond:
        id != Player.ord

  var session = initSession(Fact)
  session.add(rule1)

  session.insert(Player, X, rand(50.0))
  session.insert(Player, Y, rand(50.0))

  var nextId = Id.high.ord + 1

  for _ in 0 ..< 5:
    session.insert(nextId, X, rand(50.0))
    session.insert(nextId, Y, rand(50.0))
    nextId += 1

  check session.findAll(rule1).len == 5

test "derived facts":
  var allChars: Characters
  let rules =
    ruleset:
      rule getCharacter(Fact):
        what:
          (id, X, x)
          (id, Y, y)
        thenFinally:
          let chars = session.queryAll(this)
          session.insert(Derived, AllCharacters, chars)
      rule printAllCharacters(Fact):
        what:
          (Derived, AllCharacters, chars)
        then:
          allChars = chars

  var session = initSession(Fact, autoFire = false)
  for r in rules.fields:
    session.add(r)

  var nextId = Id.high.ord + 1

  for _ in 0 ..< 5:
    session.insert(nextId, X, rand(50.0))
    session.insert(nextId, Y, rand(50.0))
    nextId += 1

  session.fireRules()

  check allChars.len == 5

  session.retract(3, X)
  session.retract(3, Y)
  session.fireRules()

  check allChars.len == 4

test "serializing a session":
  let rules =
    ruleset:
      rule getCharacter(Fact):
        what:
          (id, X, x)
          (id, Y, y)
        thenFinally:
          let chars = session.queryAll(this)
          session.insert(Derived, AllCharacters, chars)
      rule printAllCharacters(Fact):
        what:
          (Derived, AllCharacters, chars)

  var session = initSession(Fact, autoFire = false)
  for r in rules.fields:
    session.add(r)

  var nextId = Id.high.ord + 1

  for _ in 0 ..< 5:
    session.insert(nextId, X, rand(50.0))
    session.insert(nextId, Y, rand(50.0))
    nextId += 1

  session.fireRules()

  let facts = session.queryAll()

  for fact in facts:
    case Attr(fact.attr):
      of X, Y:
        discard unwrap(fact.value, float)
      of AllCharacters:
        discard unwrap(fact.value, Characters)
      else:
        discard

  var primaryFacts: seq[(int, int, Fact)]
  for fact in facts:
    if fact.id != Derived.ord:
      primaryFacts.add(fact)

  check primaryFacts.len == facts.len - 1

# custom match type

var (session, rules) =
  initSessionWithRules(Fact, autoFire = false):
    rule getPlayer(Fact):
      what:
        (Player, X, x)
        (Player, Y, y)
    rule movePlayer(Fact):
      what:
        (Global, DeltaTime, dt)
        (Global, PressedKeys, keys, then = false)
        (Player, X, x, then = false)
      then:
        if keys.contains(263): # left arrow
          session.insert(Player, X, x - 1.0)
        elif keys.contains(262): # right arrow
          session.insert(Player, X, x + 1.0)

# this is just to ensure that this macro can be called
# twice in one module (it uses genSym to make unique type names)
discard initSessionWithRules(Fact, autoFire = false):
  rule getPlayer(Fact):
    what:
      (Player, X, x)
      (Player, Y, y)

test "performance":
  session.insert(Player, X, 0.0)
  session.insert(Player, Y, 1.0)
  session.insert(Global, DeltaTime, 100.0)
  var keys = initHashSet[int]()
  keys.incl(262)
  session.insert(Global, PressedKeys, keys)
  let indexes = session.findAll(rules.getPlayer)
  check indexes.len == 1
  check session.get(rules.getPlayer, indexes[0]).x == 0.0
  session.fireRules
  check session.get(rules.getPlayer, indexes[0]).x == 1.0

test "tips":
  block:
    var session = initSession(Fact)

    session.add:
      rule getCharacter(Fact):
        what:
          (id, X, x)
          (id, Y, y)
        then:
          #echo match
          check match.id == Player.ord

    session.insert(Player, X, 10.0)
    session.insert(Player, Y, 25.0)

  block:
    const playerId = Player # just to make sure this works

    let rule1 =
      rule getPlayer(Fact):
        what:
          (`playerId`, X, x)
          (`playerId`, Y, y)

    var session = initSession(Fact)
    session.add(rule1)

    session.insert(Player, X, 0f)
    session.insert(Player, Y, 0f)

    check session.findAll(rule1).len == 1
