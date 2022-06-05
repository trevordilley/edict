import {invokeEdict} from "@edict/react";
import {attr, edict, rule} from "@edict/core";
import {User} from "../types";
const todoEdict = edict({
  factSchema: {
    // User
    authToken: attr<User["authToken"]>(),
    profile: attr<User["profile"]>(),

    // Tasks
    taskComplete: attr<boolean>(),
    taskTitle: attr<string>(),

    // Password
    currentPassword: attr<string>(),
    isLongEnough: attr<boolean>(),
    hasSymbols: attr<boolean>(),
    hasNumbers: attr<boolean>(),
    hasUppercase: attr<boolean>(),
    hasLowercase: attr<boolean>(),
    matchesConfirm: attr<boolean>(),
    isValid: attr<boolean>()
  }})

// export const todoQueries = {
//
//   todos: addRule(({taskTitle, taskComplete}) => rule({
//     name: "All Todos",
//     what: {
//       $todo: {
//         taskTitle,
//         taskComplete,
//       }
//     }
//   })),
//
//   newTodo: addRule(({taskTitle}) => rule({
//     name: "New Todo",
//     what: {
//       newTodo: {
//         taskTitle,
//       }
//     }
//   })),
//
//   // password: addRule(({currentPassword, isValid}) =>
//   //   rule({
//   //     name: "current password is valid",
//   //     what: {
//   //       password: {
//   //         currentPassword,
//   //         isValid
//   //       }
//   //     },
//   //   })),
//   //
//   // confirm: addRule(({currentPassword}) =>
//   //   rule({
//   //     name: "confirm",
//   //     what: {
//   //       confirm: {
//   //         currentPassword,
//   //       }
//   //     },
//   //   })),
//   //
//   // longEnough: addRule(({currentPassword}, {insert}) => rule({
//   //   name: "Password is long enough",
//   //   what: {password: {currentPassword}},
//   //   then: ({password}) => {
//   //     const isLongEnough = password.currentPassword.length >= 7
//   //     insert({password: {isLongEnough}})
//   //   }
//   // })),
//   //
//   // hasSymbol: addRule(({currentPassword}, {insert}) => rule({
//   //   name: "Password has symbols",
//   //   what: {password: {currentPassword}},
//   //   then: ({password}) => {
//   //     const isContainsSymbolRegex =
//   //       /^(?=.*[~`!@#$%^&*()--+={}\[\]|\\:;"'<>,.?/_₹]).*$/;
//   //
//   //     const hasSymbols = isContainsSymbolRegex.test(password.currentPassword)
//   //
//   //     insert({password: {hasSymbols}})
//   //   }
//   // })),
//   //
//   // hasNumbers: addRule(({currentPassword}, {insert}) => rule({
//   //   name: "Password has numbers",
//   //   what: {password: {currentPassword}},
//   //   then: ({password}) => {
//   //     const isContainsNumberRegex = /^(?=.*[0-9]).*$/;
//   //     const hasNumbers = isContainsNumberRegex.test(password.currentPassword)
//   //
//   //     insert({password: {hasNumbers }})
//   //   }
//   // })),
//   //
//   // hasUppercase: addRule(({currentPassword}, {insert}) => rule({
//   //   name: "Password has uppercase letters",
//   //   what: {password: {currentPassword}},
//   //   then: ({password}) => {
//   //     const isContainsUppercaseRegex = /^(?=.*[A-Z]).*$/;
//   //     const hasUppercase = isContainsUppercaseRegex.test(password.currentPassword)
//   //
//   //     insert({password: {hasUppercase  }})
//   //   }
//   // })),
//   //
//   // hasLowercase: addRule(({currentPassword}, {insert}) => rule({
//   //   name: "Password has lowercase letters",
//   //   what: {password: {currentPassword}},
//   //   then: ({password}) => {
//   //     const isContainsLowercaseRegex = /^(?=.*[a-z]).*$/;
//   //     const hasLowercase = isContainsLowercaseRegex.test(password.currentPassword)
//   //
//   //     insert({password: {hasLowercase  }})
//   //   }
//   // })),
//   //
//   // matchesConfirm: addRule(({currentPassword}, {insert}) => rule({
//   //   name: "Password matches confirmation",
//   //   what: {password: {currentPassword}, confirm: {currentPassword}},
//   //   then: ({password, confirm}) => {
//   //     insert({password: {matchesConfirm: password.currentPassword === confirm.currentPassword}})
//   //   }
//   // })),
//   //
//   // validPassword: addRule(({currentPassword, matchesConfirm, hasLowercase, hasNumbers, hasSymbols, hasUppercase, isLongEnough}, {insert}) => rule({
//   //   name: "Password is valid",
//   //   what: {password: {currentPassword, matchesConfirm , hasUppercase , hasLowercase, hasNumbers, hasSymbols, isLongEnough}},
//   //   then: ({password}) => {
//   //     insert({password: {isValid: password.matchesConfirm && password.hasUppercase && password.hasLowercase && password.hasSymbols && password.isLongEnough}})
//   //   }
//   // })),
//   //
// }
const { Edict, useEdict } = invokeEdict(todoEdict)


export const TodoEdict = Edict
export const useTodoEdict = useEdict

