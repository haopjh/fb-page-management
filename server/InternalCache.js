

function InternalCache() {
    this.inMemory = {};
}

InternalCache.prototype.checkMemoryValidity = function(key) {
    // cache for 60 seconds
    let valid = !this.inMemory[key] || ((Date.now() / 1000 - this.inMemory[key].timestamp) > (60));
    if (!valid) {
    //     console.log("KEY:" + key + " ::: Retrieve data from cache");
    // } else {
    //     console.log("KEY:" + key + " ::: Pulled data from external network");
    }
    return valid;
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
InternalCache.prototype.reset = function(key) {
    this.inMemory = {};
}

module.exports.InternalCache = InternalCache;