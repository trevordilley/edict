export interface User{
  authToken: string,
  profile: {
    firstName: string,
    lastName: string,
    lastLogin: string,
  }
}

export interface Todo {
  id: string,
  taskTitle: string,
  taskComplete: boolean
}
