import { InternalCache } from './InternalCache.js';
import assert from 'assert';

describe('Internal Caching', function () {
    it('Create and test cache', function () {
        let cache = new InternalCache();
        assert.ok(cache, "Cache is created");
        assert.ok(cache.checkMemoryValidity("base"), "No such key exists");
        cache.cache("base", "Test #1");
        assert.ok(!cache.checkMemoryValidity("base"), "Key is saved");
        assert.ok(cache.retrieve("base") === "Test #1", "Value is correct");
        cache.clear("base");
        assert.ok(cache.checkMemoryValidity("base"), "Key is saved");
    })
})