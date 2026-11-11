import { test, expect } from 'vitest'
import { call, fork, put, select, take } from 'redux-saga/effects'
import { fetchPosts, fetchPostsApi, invalidateTopic, nextTopicChange, startup } from '../src/sagas'
import * as actions from '../src/actions'
import { postsByTopicSelector, selectedTopicSelector } from '../src/reducers/selectors'

test('fetchPosts Saga', () => {
  const mockPosts = [1, 2, 3]
  const topicName = 'react_topic'
  const generator = fetchPosts(topicName)
  expect(generator.next().value, 'must dispatch a requestPosts action').toEqual(put(actions.requestPosts(topicName)))
  expect(generator.next().value, 'must call fetchPostsApi with topic name').toEqual(call(fetchPostsApi, topicName))
  expect(generator.next(mockPosts).value, 'must dispatch a receivePosts action with posts').toEqual(
    put(actions.receivePosts(topicName, mockPosts)),
  )
  expect(generator.next().done, 'must finish').toBe(true)
})

test('invalidateTopic Saga', () => {
  const generator = invalidateTopic()
  expect(generator.next().value, 'must take a SELECT_TOPIC action').toEqual(take(actions.INVALIDATE_TOPIC))
  expect(generator.next({ topic: 'new_topic_1' }).value, 'must call fetchPosts with new topic').toEqual(
    call(fetchPosts, 'new_topic_1'),
  )
  expect(generator.next().value, 'must go back to beginning of loop').toEqual(take(actions.INVALIDATE_TOPIC))
})

test('nextTopicChange Saga when switching to new topic', () => {
  const generator = nextTopicChange()
  expect(generator.next().value, 'must select current topic from store').toEqual(select(selectedTopicSelector))
  expect(generator.next('prev_topic').value, 'must take a SELECT_TOPIC action').toEqual(take(actions.SELECT_TOPIC))
  expect(generator.next().value, 'must select newly selected topic from store').toEqual(select(selectedTopicSelector))
  expect(generator.next('new_topic').value, 'must select posts by topic from store').toEqual(
    select(postsByTopicSelector),
  )
  expect(generator.next({}).value, "delegate to fetchPosts for new topic's posts").toEqual(
    fork(fetchPosts, 'new_topic'),
  )
  expect(generator.next().value, 'must go back to beginning of loop').toEqual(select(selectedTopicSelector))
})

test('nextTopicChange Saga when same topic is selected', () => {
  const generator = nextTopicChange()
  generator.next()
  generator.next('prev_topic')
  generator.next()
  generator.next('prev_topic')
  expect(generator.next().value, 'must go back to beginning of loop').toEqual(select(selectedTopicSelector))
})

test('nextTopicChange Saga when posts were previously loaded', () => {
  const generator = nextTopicChange()
  generator.next()
  generator.next('prev_topic')
  generator.next()
  generator.next('new_topic')
  const postsByTopic = {
    new_topic: ['cached_post'],
  }
  expect(generator.next(postsByTopic).value, 'must go back to beginning of loop').toEqual(select(selectedTopicSelector))
})

test('startup Saga', () => {
  const generator = startup()
  expect(generator.next().value, 'gets currently selected topic').toEqual(select(selectedTopicSelector))
  expect(generator.next('selected_topic').value, 'delegates to fetchPosts to get posts').toEqual(
    fork(fetchPosts, 'selected_topic'),
  )
  expect(generator.next().done, 'must finish').toBe(true)
})
