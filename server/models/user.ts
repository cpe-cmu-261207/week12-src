import { Sequelize, Model, DataTypes } from 'sequelize'

export const sequelize = new Sequelize('sqlite::memory:')

export interface UserModel {
  id?: number
  username: string
  password: string
}

export class User extends Model<UserModel> {}
User.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  username: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  }
},{ sequelize, modelName: 'user' })
