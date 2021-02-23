import { Model, DataTypes } from 'sequelize'
import { sequelize } from '../configs/sequelize'

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
