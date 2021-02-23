import { Model, DataTypes } from 'sequelize'
import { sequelize } from '../configs/sequelize'

export interface TodoModel {
  id?: number
  userId: number
  title: string
  description?: string
}

export class Todo extends Model<TodoModel> {}
Todo.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
  }
}, { sequelize, modelName: 'todo' })