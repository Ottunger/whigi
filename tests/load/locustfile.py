#! /usr/bin/env python
# coding=UTF8


'''
 * Mocking of users.
 * @author Mathonet Grégoire
'''

import hashlib
from locust import HttpLocust, TaskSet, task

#For Bonjour:abdefgh
AUTH = 'Basic Qm9uam91cjo5YzU2Y2M1MWIzNzRjM2JhMTg5MjEwZDViNmQ0YmY1Nzc5MGQzNTFjOTZjNDdjMDIxOTBlY2YxZTQzMDYzNWFi'

def regPuzzle(puzzle):
    i = 0
    complete = 'aaaa'
    while complete[0] != '0' or complete[1] != '0' or complete[2] != '0' or complete[3] != '0':
        complete = hashlib.sha256(puzzle + str(i)).hexdigest()
        i += 1
    return str(i - 1)

def login(self):
    self.client.get('/')
    self.client.get('/api/v1/profile', headers={'Authorization': AUTH})

def list(self):
    self.client.get('/api/v1/profile/data', headers={'Authorization': AUTH})

def data(self):
    self.client.get('/api/v1/data/ifDCWJtWlrZ79NM5YsrAzueMmtwUGKeoWdWPO3QiwDmb1q3Nv69IFNXv4PFT3pAs1ZRjkpWyRW7X4akLi4brgUk0De1m12gju84i2YjOzCVz58HIRINWKjbY0KeR1RNp', headers={'Authorization': AUTH})

def post(self):
    res = self.client.post('/api/v1/profile/data/new', params={'puzzle': regPuzzle('0')}, data='{"name": "profile/hehe", "encr_data": "hihi", "is_dated": false}', headers={'Authorization': AUTH, 'content-type': 'application/json'})
    puzzle = res.json()['puzzle']
    self.client.post('/api/v1/profile/data/new', params={'puzzle': regPuzzle(puzzle)}, data='{"name": "profile/hehe", "encr_data": "hihi", "is_dated": false}', headers={'Authorization': AUTH, 'content-type': 'application/json'})

class PageTask(TaskSet):
    tasks = {list: 2, data: 1}
    def on_start(self):
        self.client.verify = False
        login(self)
      
class PostTask(TaskSet):
    tasks = {list: 2, post: 1}
    def on_start(self):
        self.client.verify = False
        login(self)

class Looker(HttpLocust):
    weight = 10
    host = 'https://whigi2-demo.envict.com'
    task_set = PageTask
   
class Poster(HttpLocust):
    weight = 1
    host = 'https://whigi2-demo.envict.com'
    task_set = PostTask