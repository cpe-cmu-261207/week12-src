import { Sequelize } from 'sequelize'

export const sequelize = new Sequelize('sqlite:db.sqlite')
