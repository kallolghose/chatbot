'use strict';

const nock = require('nock');
const watson = require('../../index');
const assert = require('assert');
const authHelper = require('./auth_helper.js');
const auth = authHelper.auth;
const describe = authHelper.describe; // this runs describe.skip if there is no auth.js file :)
const assign = require('object.assign'); // for node v0.12 compatibility
const ConversationV1 = require('../../conversation/v1');

const extend = require('extend');

const TEN_SECONDS = 10000;
const TWO_SECONDS = 2000;

const workspace = {
  name: 'integration test',
  language: 'fr',
  entities: [
    {
      entity: 'hello',
      values: [
        {
          value: 'hola',
          synonyms: ['yo', 'yoo']
        }
      ]
    }
  ]
};

const intents = {
  language: 'en',
  intents: [
    {
      intent: 'test',
      examples: [
        {
          text: 'I test'
        }
      ]
    }
  ]
};

const test_intents = [
  {
    intent: 'intent_1',
    examples: [
      {
        text: 'Hi, here\'s a URL ☺ http://example.com/?a=$+*^;&c=%20#!"`~'
      }
    ]
  }
];
const test_intents_update = {
  intent: 'intent_2',
  description: 'description_2',
  examples: [
    {
      text: 'Hey, here\'s a URL ☺ http://example.com/?a=$+*^;&c=%20#!"`~'
    }
  ]
};
const test_examples_new = 'Oh, here\'s a URL ☺ http://example.com/?a=$+*^;&c=%20#!"`~';
const counterExampleText = 'Hey, here\'s a URL ☺ http://example.com/?a=$+*^;&c=%20#!"`~';
const counterExampleText_new = 'Oh, here\'s a URL ☺ http://example.com/?a=$+*^;&c=%20#!"`~';

const workspace1 = extend(true, {}, workspace, intents);

describe('conversation_integration', function() {
  this.timeout(TEN_SECONDS);
  this.slow(TWO_SECONDS); // this controls when the tests get a colored warning for taking too long
  // this.retries(1);

  let conversation;

  before(function() {
    conversation = watson.conversation(auth.conversation);
    nock.enableNetConnect();
  });

  after(function() {
    nock.disableNetConnect();
  });

  describe('message()', function() {
    it('alternate_intents', function(done) {
      const params = {
        input: {
          text: 'Turn on the lights'
        },
        alternate_intents: true,
        workspace_id: auth.conversation.workspace_id
      };

      conversation.message(params, function(err, result) {
        if (err) {
          return done(err);
        }
        assert.equal(result.alternate_intents, true);
        done();
      });
    });

    it('dialog_stack with 2017-02-03 version_date', function(done) {
      const constructorParams = assign({}, auth.conversation, {
        version_date: ConversationV1.VERSION_DATE_2017_02_03
      });
      const conversation = watson.conversation(constructorParams);

      const params = {
        input: {
          text: 'Turn on the lights'
        },
        workspace_id: auth.conversation.workspace_id
      };

      conversation.message(params, function(err, result) {
        if (err) {
          return done(err);
        }
        assert.deepEqual(result.context.system.dialog_stack, [{ dialog_node: 'root' }]);
        done();
      });
    });

    it('dialog_stack with 2016-09-20 version_date', function(done) {
      const constructorParams = assign({}, auth.conversation, {
        version_date: ConversationV1.VERSION_DATE_2016_09_20
      });
      const conversation = watson.conversation(constructorParams);

      const params = {
        input: {
          text: 'Turn on the lights'
        },
        workspace_id: auth.conversation.workspace_id
      };

      conversation.message(params, function(err, result) {
        if (err) {
          return done(err);
        }
        assert.deepEqual(result.context.system.dialog_stack, [{ dialog_node: 'root' }]);
        done();
      });
    });

    it('dialog_stack with 2016-07-11 version_date', function(done) {
      const constructorParams = assign({}, auth.conversation, {
        version_date: ConversationV1.VERSION_DATE_2016_07_11
      });
      const conversation = watson.conversation(constructorParams);

      const params = {
        input: {
          text: 'Turn on the lights'
        },
        workspace_id: auth.conversation.workspace_id
      };

      conversation.message(params, function(err, result) {
        if (err) {
          return done(err);
        }
        assert.deepEqual(result.context.system.dialog_stack, ['root']);
        done();
      });
    });
  });

  describe('listWorkspaces()', function() {
    it('result should contain workspaces key', function(done) {
      conversation.listWorkspaces(function(err, result) {
        if (err) {
          return done(err);
        }
        assert.equal(result.hasOwnProperty('workspaces'), true);
        done();
      });
    });

    it('result should contain an array of workspaces', function(done) {
      conversation.listWorkspaces(function(err, result) {
        if (err) {
          return done(err);
        }
        assert.equal(Object.prototype.toString.call(result.workspaces), '[object Array]');
        done();
      });
    });

    it('result should return pagination information', function(done) {
      const params = {
        page_limit: 2,
        include_count: true,
        sort: '-name'
      };
      conversation.listWorkspaces(params, function(err, result) {
        if (err) {
          return done(err);
        }
        assert.equal(result.hasOwnProperty('pagination'), true);
        done();
      });
    });
  });

  describe('createWorkspace()', function() {
    it('should create a new workspace', function(done) {
      const params = workspace;

      conversation.createWorkspace(params, function(err, result) {
        if (err) {
          return done(err);
        }
        workspace1.workspace_id = result.workspace_id;
        assert.equal(result.name, params.name);
        assert.equal(result.language, 'fr');
        assert.equal(result.metadata, params.metadata);
        assert.equal(result.description, params.description);
        done();
      });
    });
  });

  describe('updateWorkspace()', function() {
    it('should update the workspace with intents and language', function(done) {
      const params = workspace1;

      conversation.updateWorkspace(params, function(err, result) {
        if (err) {
          return done(err);
        }
        assert.equal(result.name, params.name);
        assert.equal(result.language, 'en');
        assert.equal(result.metadata, params.metadata);
        assert.equal(result.description, params.description);
        done();
      });
    });
  });

  describe('getWorkspace()', function() {
    it('should get the workspace with the right intent', function(done) {
      const params = {
        export: true,
        workspace_id: workspace1.workspace_id
      };

      conversation.getWorkspace(params, function(err, result) {
        if (err) {
          return done(err);
        }
        assert.equal(result.intents[0].intent, 'test');
        done();
      });
    });
  });

  describe('workspaceStatus()', function() {
    it('should get the workspace status', function(done) {
      const params = {
        workspace_id: workspace1.workspace_id
      };

      conversation.workspaceStatus(params, function(err, result) {
        if (err) {
          return done(err);
        }
        assert.equal(result.workspace_id, workspace1.workspace_id);
        assert.equal(result.training, true);
        done();
      });
    });
  });

  describe('createIntent()', function() {
    it('should create an intent', function(done) {
      const params = {
        workspace_id: workspace1.workspace_id,
        intent: test_intents[0].intent,
        examples: test_intents[0].examples
      };

      conversation.createIntent(params, function(err, result) {
        if (err) {
          return done(err);
        }
        assert.equal(result.intent, test_intents[0].intent);
        assert.equal(result.description, null);
        done();
      });
    });
  });

  describe('getIntents()', function() {
    it('should get intents of the workspace', function(done) {
      const params = {
        workspace_id: workspace1.workspace_id,
        export: true
      };

      conversation.getIntents(params, function(err, result) {
        if (err) {
          return done(err);
        }
        assert.equal(result.intents[0].intent, test_intents[0].intent);
        assert.equal(result.intents[0].examples[0].text, test_intents[0].examples[0].text);
        done();
      });
    });

    it('should have pagination information', function(done) {
      const params = {
        workspace_id: workspace1.workspace_id,
        export: true,
        page_limit: 1,
        include_count: true,
        sort: 'intent'
      };

      conversation.getIntents(params, function(err, result) {
        if (err) {
          return done(err);
        }
        assert.equal(result.hasOwnProperty('pagination'), true);
        done();
      });
    });
  });

  describe('getIntent()', function() {
    it('should get an intent of the workspace', function(done) {
      const params = {
        workspace_id: workspace1.workspace_id,
        intent: test_intents[0].intent
      };

      conversation.getIntent(params, function(err, result) {
        if (err) {
          return done(err);
        }
        assert.equal(result.intent, test_intents[0].intent);
        assert.equal(result.description, null);
        done();
      });
    });
  });

  describe('updateIntent()', function() {
    it('should update an intent of the workspace', function(done) {
      const params = {
        workspace_id: workspace1.workspace_id,
        old_intent: test_intents[0].intent,
        intent: test_intents_update.intent,
        description: test_intents_update.description,
        examples: test_intents_update.examples
      };

      conversation.updateIntent(params, function(err, result) {
        if (err) {
          return done(err);
        }
        assert.equal(result.intent, test_intents_update.intent);
        done();
      });
    });
  });

  describe('getExamples()', function() {
    it('should get all examples of intent', function(done) {
      const params = {
        workspace_id: workspace1.workspace_id,
        intent: test_intents_update.intent
      };

      conversation.getExamples(params, function(err, result) {
        if (err) {
          return done(err);
        }
        assert.equal(result.examples[0].text, test_intents_update.examples[0].text);
        done();
      });
    });

    it('should have pagination information', function(done) {
      const params = {
        workspace_id: workspace1.workspace_id,
        intent: test_intents_update.intent,
        page_limit: 2,
        include_count: true,
        sort: '-text'
      };

      conversation.getExamples(params, function(err, result) {
        if (err) {
          return done(err);
        }
        assert.equal(result.hasOwnProperty('pagination'), true);
        done();
      });
    });
  });

  describe('createExample()', function() {
    it('should create an example in the intent', function(done) {
      const params = {
        workspace_id: workspace1.workspace_id,
        intent: test_intents_update.intent,
        text: 'new_example'
      };

      conversation.createExample(params, function(err, result) {
        if (err) {
          return done(err);
        }
        assert.equal(result.text, 'new_example');
        done();
      });
    });
  });

  describe('getExample()', function() {
    it('should get an example of intent', function(done) {
      const params = {
        workspace_id: workspace1.workspace_id,
        intent: test_intents_update.intent,
        text: test_intents_update.examples[0].text
      };

      conversation.getExample(params, function(err, result) {
        if (err) {
          return done(err);
        }
        assert.equal(result.text, test_intents_update.examples[0].text);
        done();
      });
    });
  });

  describe('updateExample()', function() {
    it('should update an example of intent', function(done) {
      const params = {
        workspace_id: workspace1.workspace_id,
        intent: test_intents_update.intent,
        old_text: test_intents_update.examples[0].text,
        text: test_examples_new
      };

      conversation.updateExample(params, function(err, result) {
        if (err) {
          return done(err);
        }
        assert.equal(result.text, test_examples_new);
        done();
      });
    });
  });

  describe('deleteExample()', function() {
    it('should delete an example of intent', function(done) {
      const params = {
        workspace_id: workspace1.workspace_id,
        intent: test_intents_update.intent,
        text: test_examples_new
      };

      conversation.deleteExample(params, function(err, result) {
        if (err) {
          return done(err);
        }
        done();
      });
    });
  });

  describe('deleteIntent()', function() {
    it('should delete an intent of the workspace', function(done) {
      const params = {
        workspace_id: workspace1.workspace_id,
        intent: test_intents_update.intent
      };

      conversation.deleteIntent(params, function(err, result) {
        if (err) {
          return done(err);
        }
        done();
      });
    });
  });

  describe('createCounterExample()', function() {
    it('should return the newly created counterExample of the workspace', function(done) {
      const params = {
        workspace_id: workspace1.workspace_id,
        text: counterExampleText
      };

      conversation.createCounterExample(params, function(err, result) {
        if (err) {
          return done(err);
        }
        assert.equal(result.text, counterExampleText);
        done();
      });
    });
  });

  describe('getCounterExample()', function() {
    it('should return a counterExample', function(done) {
      const params = {
        workspace_id: workspace1.workspace_id,
        text: counterExampleText
      };

      conversation.getCounterExample(params, function(err, result) {
        if (err) {
          return done(err);
        }
        assert.equal(result.text, counterExampleText);
        done();
      });
    });
  });

  describe('getCounterExamples()', function() {
    it('should return counterExamples of the workspace', function(done) {
      const params = {
        workspace_id: workspace1.workspace_id
      };

      conversation.getCounterExamples(params, function(err, result) {
        if (err) {
          return done(err);
        }
        assert.equal(result.counterexamples[0].text, counterExampleText);
        done();
      });
    });
    it('should return counterExamples of the workspace with pagination', function(done) {
      const params = {
        workspace_id: workspace1.workspace_id,
        page_limit: 1,
        include_count: true,
        sort: 'text'
      };

      conversation.getCounterExamples(params, function(err, result) {
        if (err) {
          return done(err);
        }
        assert.equal(result.counterexamples[0].text, counterExampleText);
        assert.equal(result.hasOwnProperty('pagination'), true);
        done();
      });
    });
  });

  describe('updateCounterExample()', function() {
    it('should return an updated counterExample', function(done) {
      const params = {
        workspace_id: workspace1.workspace_id,
        old_text: counterExampleText,
        text: counterExampleText_new
      };

      conversation.updateCounterExample(params, function(err, result) {
        if (err) {
          return done(err);
        }
        assert.equal(result.text, counterExampleText_new);
        done();
      });
    });
  });

  describe('deleteCounterExample()', function() {
    it('should delete a counterExample', function(done) {
      const params = {
        workspace_id: workspace1.workspace_id,
        text: counterExampleText_new
      };

      conversation.deleteCounterExample(params, function(err, result) {
        if (err) {
          return done(err);
        }
        done();
      });
    });
  });

  describe('deleteWorkspace()', function() {
    it('should delete the workplace', function(done) {
      const params = {
        workspace_id: workspace1.workspace_id
      };

      conversation.deleteWorkspace(params, function(err, result) {
        if (err) {
          return done(err);
        }
        done();
      });
    });
  });
});
