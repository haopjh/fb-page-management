

function InternalCache() {
    this.inMemory = {};
}

InternalCache.prototype.checkMemoryValidity = function(key) {
    // cache for 60 seconds
    let validity = !this.inMemory[key] || 
        ((Date.now() / 1000 - this.inMemory[key].timestamp) > (60));

    // Returns true if does not exist in cache
    return validity;
}


InternalCache.prototype.cache = function(key, data) {
    // Cache results
    this.inMemory[key] = {
        timestamp: Date.now() / 1000,
        data: data
    };
}
InternalCache.prototype.retrieve = function(key) {
    return this.inMemory[key] ? this.inMemory[key].data : null;
}
InternalCache.prototype.clear = function(key) {
    this.inMemory[key] = null;
}

module.exports.InternalCache = InternalCache;