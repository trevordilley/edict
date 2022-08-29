import unittest
import pararules
import tables, sets

type
  People = seq[tuple[id: int, color: string, leftOf: int, height: int]]
  Id* = enum
    Alice, Bob, Charlie, David, George,
    Seth, Thomas, Xavier, Yair, Zach,
    Derived,
  Attr* = enum
    Color, LeftOf, RightOf, Height, On, Age, Self,
    AllPeople,

schema Fact(Id, Attr):
  Color: string
  LeftOf: Id
  RightOf: Id
  Height: int
  On: string
  Age: int
  Self: Id
  AllPeople: People

proc `==`(a: int, b: Id): bool =
  a == b.ord

# test "number of conditions != number of facts":
test "x":
  var session = initSession(Fact)
  echo(session)
  let rule1 =
    rule numCondsAndFacts(Fact):
      what:
        (Bob, Color, "blue")
        (y, LeftOf, z)
        (a, Color, "maize")
        (y, RightOf, b)
        (x, Height, h)
      then:
        check a == Alice
        check b == Bob
        check y == Yair
        check z == Zach
      cond:
        a != Bob

      thenFinally:
        echo "finnaly"
  session.add(rule1)

  session.insert(Bob, Color, "blue")
  session.insert(Yair, LeftOf, Zach)
  session.insert(Alice, Color, "maize")
  session.insert(Yair, RightOf, Bob)

  session.insert(Xavier, Height, 72)
  session.insert(Thomas, Height, 72)
  session.insert(George, Height, 72)

  check session.queryAll(rule1).len == 3


# this one is not used...
# it's just here to make sure we can define
# multiple schemas in one module
schema Stuff(Id, Attr):
  Color: int
  LeftOf: Id
  RightOf: Id
  Height: float
  On: string
  Age: int
  Self: Id
  AllPeople: People
