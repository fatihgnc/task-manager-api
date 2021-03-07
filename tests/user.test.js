const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/user')
const { userOneId, userOne, setupDatabase } = require('./fixtures/db')

beforeEach(setupDatabase)

const auth = 'Authorization'
const token = userOne.tokens[0].token

test('Should signup a new user', async () => {
    const response = await request(app)
        .post('/users')
        .send({
        name: 'fatih young',
        email: 'young@example.com',
        password: 'computer098'
        })
        .expect(201)

    // Assert that the database was changed correctly
    const user = await User.findById(response.body.user._id)

    expect(user).not.toBeNull()

    // Assertions about the response
    // expect(response.body.user.name).toBe('Andrew')
    expect(response.body).toMatchObject({
        user: {
            name: 'fatih young',
            email: 'young@example.com'
        },
        token: user.tokens[0].token
    })
    expect(user.password).not.toBe('computer098')
})

test('Should login existing user', async () => {
    const response = await request(app)
        .post('/users/login')
        .send({
            email: userOne.email,
            password: userOne.password
        })
        .expect(200)
    
    const user = await User.findById(userOneId)

    expect(response.body.token).toBe(user.tokens[1].token)
})

test('Should not login nonexistent user!', async () => {
    await request(app)
        .post('/users/login')
        .send({
            email: userOne.email,
            password: 'asdasd'
        })
        .expect(400)
})

test('Should get profile for user', async () => {
    await request(app)
        .get('/users/me')
        .set(auth, token)
        .send()
        .expect(200)
})

test('Should not get profile for unauthenticated user', async () => {
    await request(app)
        .get('/users/me')
        .send()
        .expect(401)
})

test('Should delete account for user', async () => {
    await request(app)
        .delete('/users/me')
        .set(auth, token)
        .send()
        .expect(200)

    const user = await User.findById(userOneId)
    expect(user).toBeNull()
})

test('Should not delete unauthorised user', async () => {
    await request(app)
        .delete('/users/me')
        .send() 
        .expect(401)
})

test('Should upload avatar image', async () => {
    await request(app)
        .post('/users/me/avatar')
        .set(auth, token)
        .attach('avatar', 'tests/fixtures/profile-pic.jpg')
        .expect(200)

    const user = await User.findById(userOneId)
    expect(user.avatar).toEqual(expect.any(Buffer))
})

 test('Should update valid user fields', async () => {
    await request(app)
        .patch('/users/me')
        .set(auth, token)
        .send({ name: 'Fatih' })
        .expect(200)
    
    const user = await User.findById(userOneId)

    expect(user.name).toEqual('Fatih')
 })

 test('Should not update invalid user fields', async () => {
    await request(app)
        .patch('/users/me')
        .set(auth, token)
        .send({ location: 'Sessionshistan' })
        .expect(400)
 })

 test('Should not signup user with invalid name,email or password', async () => {
    const response = await request(app)
        .post('/users')
        .send({
            name: 'fatih',
            email: 'asd@example.com',
            password: '123456'
        })
        .expect(400)

    const user = await User.findOne({
        email: 'asd@example.com'
    })

    expect(user).toBeNull()
 })

 test('Should not update user if unauthenticated', async () => {
    await request(app)
        .patch('/users/me')
        .send({ name: 'Michael' })
        .expect(401)
 })

 test('Should not update user with invalid name/email/password', async () => {
    await request(app)
        .patch('/users/me')
        .set(auth, token)
        // .send({ password: 'password!' })
        // .send({ email: example!example.com })
        .send({ height: 175 })
        .expect(400)
 })

 test('Should not delete user if unauthenticated', async () => {
    await request(app)
        .delete('/users/me')
        .send()
        .expect(401)
 })