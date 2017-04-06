'use strict';

const assert = require('assert');
const Discovery = require('../../discovery/v1');
const fs = require('fs');
const path = require('path');

const nock = require('nock');

describe('discovery-v1', function() {
  const noop = function() {};

  // Test params
  const service = {
    username: 'batman',
    password: 'bruce-wayne',
    url: 'http://ibm.com:80',
    version: 'v1',
    version_date: '2016-12-15'
  };

  const service1 = {
    password: 'bruce-wayne',
    url: 'http://ibm.com:80',
    version: 'v1',
    username: 'batman'
  };

  const paths = {
    environments: '/v1/environments',
    environmentinfo: '/v1/environments/env-guid',
    collections: '/v1/environments/env-guid/collections',
    collectioninfo: '/v1/environments/env-guid/collections/col-guid',
    configurations: '/v1/environments/env-guid/configurations',
    configurationinfo: '/v1/environments/env-guid/configurations/config-guid',
    delete_collection: '/v1/environments/env-guid/collections/col-guid',
    add_document: '/v1/environments/env-guid/collections/col-guid/documents',
    delete_document: '/v1/environments/env-guid/collections/col-guid/documents/document-guid',
    query: '/v1/environments/env-guid/collections/col-guid/query'
  };

  before(function() {
    nock.disableNetConnect();
    nock(service.url)
      .persist()
      .post(paths.environments + '?version=' + service.version_date)
      .reply(200, { environment_id: 'yes' })
      .get(paths.environmentinfo + '?version=' + service.version_date)
      .reply(200, { environment_id: 'info' })
      .delete(paths.environmentinfo + '?version=' + service.version_date)
      .reply(200, { environment_id: 'info' })
      .get(paths.collections + '?version=' + service.version_date)
      .reply(200, { collection_id: 'yes' })
      .get(paths.collectioninfo + '?version=' + service.version_date)
      .reply(200, { collection_id: 'info' })
      .get(paths.query + '?version=' + service.version_date)
      .reply(200, { query: 'yes' })
      .post(paths.collections + '?version=' + service.version_date)
      .reply(200, { collection_id: 'yes' })
      .delete(paths.delete_collection + '?version=' + service.version_date)
      .reply(200, { config: 'yes' })
      .post(paths.add_document + '?version=' + service.version_date)
      .reply(200, { add_doc: 'yes' })
      .delete(paths.delete_document + '?version=' + service.version_date)
      .reply(200, { delete_doc: 'yes' })
      .get(paths.configurations + '?version=' + service.version_date)
      .reply(200, { configs: 'yes' });
  });

  after(function() {
    nock.cleanAll();
  });

  const discovery = new Discovery(service);

  describe('discovery()', function() {
    it('should generate a valid payload', function() {
      const req = discovery.getEnvironments({}, noop);
      assert.equal(req.uri.href, service.url + paths.environments + '?version=' + service.version_date);
      assert.equal(req.method, 'GET');
    });

    it('should generate version_date was not specified (negative test)', function() {
      function doThrowThing() {
        const discovery = new Discovery(service1);
        assert(discovery);
      }
      assert.throws(doThrowThing, /version_date/);
    });

    it('should create an environment', function() {
      const req = discovery.createEnvironment(
        {
          name: 'new environment',
          description: 'my description'
        },
        noop
      );
      assert.equal(req.method, 'POST');
    });

    it('should get an environment information', function() {
      const req = discovery.getEnvironment({ environment_id: 'env-guid' }, noop);
      assert.equal(req.uri.href, service.url + paths.environmentinfo + '?version=' + service.version_date);
      assert.equal(req.method, 'GET');
    });

    it('should delete an environment', function() {
      const req = discovery.deleteEnvironment({ environment_id: 'env-guid' }, noop);
      assert.equal(req.uri.href, service.url + paths.environmentinfo + '?version=' + service.version_date);
      assert.equal(req.method, 'DELETE');
    });

    it('should get collections from an environment', function() {
      const req = discovery.getCollections({ environment_id: 'env-guid' }, noop);
      assert.equal(req.uri.href, service.url + paths.collections + '?version=' + service.version_date);
      assert.equal(req.method, 'GET');
    });

    it('should get information about a specific collection and environment', function() {
      const req = discovery.getCollection(
        {
          environment_id: 'env-guid',
          collection_id: 'col-guid'
        },
        noop
      );
      assert.equal(req.uri.href, service.url + paths.collectioninfo + '?version=' + service.version_date);
      assert.equal(req.method, 'GET');
    });

    it('should delete a collection in an environment', function() {
      const req = discovery.deleteCollection(
        {
          environment_id: 'env-guid',
          collection_id: 'col-guid'
        },
        noop
      );
      assert.equal(req.uri.href, service.url + paths.delete_collection + '?version=' + service.version_date);
      assert.equal(req.method, 'DELETE');
    });

    it('should get information about configurations in a specific environment', function() {
      const req = discovery.getConfigurations({ environment_id: 'env-guid' }, noop);
      assert.equal(req.uri.href, service.url + paths.configurations + '?version=' + service.version_date);
      assert.equal(req.method, 'GET');
    });

    it('should get information about a specific configuration in a specific environment', function() {
      const req = discovery.getConfiguration({ environment_id: 'env-guid', configuration_id: 'config-guid' }, noop);
      assert.equal(req.uri.href, service.url + paths.configurationinfo + '?version=' + service.version_date);
      assert.equal(req.method, 'GET');
    });

    it('should add a document to a collection and environment', function() {
      const req = discovery.addDocument(
        {
          environment_id: 'env-guid',
          collection_id: 'col-guid',
          file: fs.createReadStream(path.join(__dirname, '../resources/sampleHtml.html'))
        },
        noop
      );
      assert.equal(req.uri.href, service.url + paths.add_document + '?version=' + service.version_date);
      assert.equal(req.method, 'POST');
    });

    it('should delete a document in a collection and environment', function() {
      const req = discovery.deleteDocument(
        {
          environment_id: 'env-guid',
          collection_id: 'col-guid',
          document_id: 'document-guid'
        },
        noop
      );
      assert.equal(req.uri.href, service.url + paths.delete_document + '?version=' + service.version_date);
      assert.equal(req.method, 'DELETE');
    });

    it('should perform a query', function() {
      const req = discovery.query(
        {
          environment_id: 'env-guid',
          collection_id: 'col-guid',
          filter: 'yesplease',
          count: 10
        },
        noop
      );
      assert.equal(req.uri.href, service.url + paths.query + '?version=' + service.version_date + '&filter=yesplease&count=10');
      assert.equal(req.method, 'GET');
    });
  });
});
