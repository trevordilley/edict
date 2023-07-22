import { edict } from '@edict/edict'
import { consoleAuditor } from '../../../../rete/src/lib/audit/audit'

interface Schema {
  meetsCriteria: boolean
  valid: boolean
  reason: string
  password: string
}

export const session = edict<Schema>(true, consoleAuditor())

const MIN_LENGTH = 12
session
  .rule(
    `Password must be at least ${MIN_LENGTH} characters long`,
    ({ password }) => ({
      Password: {
        password,
      },
    })
  )
  .enact({
    then: ({ Password: { password } }) => {
      session.insert({
        Length: {
          meetsCriteria: password.length >= MIN_LENGTH,
        },
      })
    },
  })

session
  .rule('Password must contain special characters', ({ password }) => ({
    Password: {
      password,
    },
  }))
  .enact({
    then: ({ Password: { password } }) => {
      const specialCharacter =
        /^(?=.*[~`!@#$%^&*()--+={}\[\]|\\:;"'<>,.?/_₹]).*$/
      session.insert({
        SpecialCharacters: {
          meetsCriteria: specialCharacter.test(password),
        },
      })
    },
  })

session
  .rule('Password must contain a digit', ({ password }) => ({
    Password: {
      password,
    },
  }))
  .enact({
    then: ({ Password: { password } }) => {
      const containsNumber = /^(?=.*[0-9]).*$/
      session.insert({
        Digit: {
          meetsCriteria: containsNumber.test(password),
        },
      })
    },
  })

session
  .rule('Password has an uppercase character', ({ password }) => ({
    Password: {
      password,
    },
  }))
  .enact({
    then: ({ Password: { password } }) => {
      const containsUpperCase = /^(?=.*[A-Z]).*$/
      session.insert({
        UpperCase: {
          meetsCriteria: containsUpperCase.test(password),
        },
      })
    },
  })

session
  .rule('Password has a lowercase character', ({ password }) => ({
    Password: {
      password,
    },
  }))
  .enact({
    then: ({ Password: { password } }) => {
      const containsLowerCase = /^(?=.*[a-z]).*$/
      session.insert({
        LowerCase: {
          meetsCriteria: containsLowerCase.test(password),
        },
      })
    },
  })

session
  .rule('Password is not a common password', ({ password }) => ({
    Password: {
      password,
    },
  }))
  .enact({
    then: ({ Password: { password } }) => {
      const commonPassword = ['123456', 'abcdef', '111111', '222222']
      session.insert({
        IsNotCommon: {
          meetsCriteria: !commonPassword.includes(password),
        },
      })
    },
  })

session
  .rule('Password is trimmed', () => ({
    Password: {
      password: { then: false }, // Don't retrigger rule from insert in `then` block
    },
  }))
  .enact({
    then: ({ Password: { password } }) => {
      session.insert({
        Password: {
          password: password.trim(),
        },
      })
    },
  })

export const criteriaQuery = session
  .rule('Passwords meeting all criteria are valid', ({ meetsCriteria }) => ({
    $criteria: {
      meetsCriteria,
    },
  }))
  .enact({
    thenFinally: (results) => {
      const valid = results()
        .map(({ $criteria }) => $criteria.meetsCriteria)
        .reduce((prev, cur) => prev && cur)
      session.insert({
        Password: {
          valid,
        },
      })
    },
  })

export const passwordQuery = session
  .rule('Password Query', ({ valid }) => ({
    Password: {
      valid,
    },
  }))
  .enact()
