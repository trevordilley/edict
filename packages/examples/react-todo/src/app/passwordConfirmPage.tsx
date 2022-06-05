
import {invokeEdict} from "@edict/react";
import {attr, edict, rule} from "@edict/core";
import {FormEvent, useEffect, useMemo} from "react";
import _ from "lodash";


export function PasswordConfirmPage() {
  const { useEdict } = invokeEdict(edict(
    {
      factSchema: {
        current: attr<string>(),
        isLongEnough: attr<boolean>(),
        hasSymbols: attr<boolean>(),
        hasNumbers: attr<boolean>(),
        hasUppercase: attr<boolean>(),
        hasLowercase: attr<boolean>(),
        matchesConfirm: attr<boolean>(),
        isValid: attr<boolean>()
      }}))
  const {insert, addRule} = useEdict()
  useEffect(() => {
    insert({password: {
      current: "",
        isValid: false
      },
      confirm: {
      current: ""
      }
    })
  },[])

  const queries = useMemo(() => ({
    password: addRule(({current, isValid}) =>
      rule({
        name: "password",
        what: {
          password: {
            current,
            isValid
          }
        },
      })),

    confirm: addRule(({current}) =>
      rule({
        name: "confirm",
        what: {
          confirm: {
            current,
          }
        },
      })),

    longEnough: addRule(({current}, {insert}) => rule({
      name: "Password is long enough",
      what: {password: {current}},
      then: ({password}) => {
        const isLongEnough = password.current.length >= 7
        insert({password: {isLongEnough}})
      }
    })),

    hasSymbol: addRule(({current}, {insert}) => rule({
      name: "Password has symbols",
      what: {password: {current}},
      then: ({password}) => {
        const isContainsSymbolRegex =
          /^(?=.*[~`!@#$%^&*()--+={}\[\]|\\:;"'<>,.?/_₹]).*$/;

        const hasSymbols = isContainsSymbolRegex.test(password.current)

        insert({password: {hasSymbols}})
      }
    })),

    hasNumbers: addRule(({current}, {insert}) => rule({
      name: "Password has numbers",
      what: {password: {current}},
      then: ({password}) => {
        const isContainsNumberRegex = /^(?=.*[0-9]).*$/;
        const hasNumbers = isContainsNumberRegex.test(password.current)

        insert({password: {hasNumbers }})
      }
    })),

    hasUppercase: addRule(({current}, {insert}) => rule({
      name: "Password has uppercase letters",
      what: {password: {current}},
      then: ({password}) => {
        const isContainsUppercaseRegex = /^(?=.*[A-Z]).*$/;
        const hasUppercase = isContainsUppercaseRegex.test(password.current)

        insert({password: {hasUppercase  }})
      }
    })),

    hasLowercase: addRule(({current}, {insert}) => rule({
      name: "Password has lowercase letters",
      what: {password: {current}},
      then: ({password}) => {
        const isContainsLowercaseRegex = /^(?=.*[a-z]).*$/;
        const hasLowercase = isContainsLowercaseRegex.test(password.current)

        insert({password: {hasLowercase  }})
      }
    })),

    matchesConfirm: addRule(({current}, {insert}) => rule({
      name: "Password matches confirmation",
      what: {password: {current}, confirm: {current}},
      then: ({password, confirm}) => {
        insert({password: {matchesConfirm: password.current === confirm.current}})
      }
    })),

    validPassword: addRule(({current, matchesConfirm, hasLowercase, hasNumbers, hasSymbols, hasUppercase, isLongEnough}, {insert}) => rule({
      name: "Password is valid",
      what: {password: {current, matchesConfirm , hasUppercase , hasLowercase, hasNumbers, hasSymbols, isLongEnough}},
      then: ({password}) => {
        insert({password: {isValid: password.matchesConfirm && password.hasUppercase && password.hasLowercase && password.hasSymbols && password.isLongEnough}})
      }
    })),

  }),[])
  const password = _.first(queries.password.query())?.password
  const confirm = _.first(queries.confirm.query())?.confirm
  const isValid = `${password?.isValid}`
  return (
    <div>
      <h1>Create New Password</h1>
      <form>
        <label>Password: </label>
        <input type={"text"} value={password?.current} onChange={(ev: FormEvent<HTMLInputElement>) => insert({password: {current: ev.currentTarget.value}}) }/>
        <p/>
        <label>Confirm: </label>
        <input type={"text"} value={confirm?.current} onChange={(ev: FormEvent<HTMLInputElement>) => insert({confirm: {current: ev.currentTarget.value}}) }/>
        <p>Is valid: {isValid}</p>
      </form>
      <a href={"/game"}>Game</a>
    </div>
  );
}
