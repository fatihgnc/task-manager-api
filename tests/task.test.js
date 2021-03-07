const request = require('supertest');
const app = require('../src/app');
const Task = require('../src/models/task')

const { userOneId, userTwoId, userTwo, userOne, taskOne, taskTwo, taskThree, setupDatabase } = require('./fixtures/db')

const auth = 'Authorization'
const token = userOne.tokens[0].token
const secondToken = userTwo.tokens[0].token

beforeEach(setupDatabase)

test('Should create task for user', async () => {
    const response = await request(app)
        .post('/tasks')
        .set(auth, token)
        .send({
            description: 'Testing the tasks'
        })
        .expect(201)
    
    const task = await Task.findById(response.body._id)
    expect(task).not.toBeNull()
    expect(task.completed).toBe(false)
})

test('Should return user\'s tasks!', async () => {
    const response = await request(app)
        .get('/tasks')
        .set(auth, token)
        .send()
        .expect(200)
    
    // console.log(response)
    // const respLength = response.body.length
    expect(response.body.length).toEqual(2)
})  

test('should fail deleting another user\'s task', async () => {
    await request(app)
        .delete(`/tasks/${taskThree._id}`)
        .set(auth, token)
        .send()
        .expect(404)
    
    const task = await Task.findById(taskOne._id)

    expect(task).not.toBeNull()
})

test('should not create task with invalid description/completed value', async () => {
    await request(app)
        .post('/tasks')
        .set(auth, token)
        .send({
            description: [1,3,4], 
            completed: 'true'
        })
        .expect(400)
    
    const task = await Task.findOne({
            description: [1,3,4], 
            completed: 'true'
    })

    expect(task).toBeNull()
})

test('Should not update task with invalid description/completed', async () => {
    await request(app)
        .patch(`/tasks/${taskOne._id}`)
        .set(auth, token)
        .send({ completed: 'incorrect data' })
        .expect(400)
})

test('should delete user task', async () => {
    await request(app)
        .delete(`/tasks/${taskOne._id}`)
        .set(auth, token)
        .send()
        .expect(200)

    const task = Task.findById(taskOne._id)

    expect(task.completed).toBeUndefined()
})

test('should not delete task if unauthenticated', async () => {
    await request(app)
        .delete(`/tasks/${taskOne._id}`)
        .send()
        .expect(401)

    const task = Task.findById(taskOne._id)

    expect(task).not.toBeNull()
})

test('should not update other users\' tasks', async () => {
    await request(app)
        .patch(`/tasks/${taskOne._id}`)
        .set(auth, secondToken)
        .send({ description: 'secondToken' })
        .expect(404)

    const task = await Task.findOne({ description: 'secondToken' })

    expect(task).toBeNull()
})

test('should not get other users\' tasks', async () => {
    await request(app)
        .get(`/tasks/${taskOne._id}`)
        .set(auth, secondToken)
        .send()
        .expect(404)
})
