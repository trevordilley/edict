export interface User{
  authToken: string,
  profile: {
    firstName: string,
    lastName: string,
    lastLogin: string,
  }
}

export interface ITodo {
  id: string,
  title: string,
  isComplete: boolean
}
