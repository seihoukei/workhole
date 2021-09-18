/*
Workhole module by seihoukei

Creates a wormhole between worker and main context to call object methods and get results over promise.

Usage:

1) create a workhole wrapper for worker

workhole = new Workhole(worker / self)

2) export an object

workhole.export(object, name)

3) import an object in another context

remote = workhole.import(name)
or
workhole.onexport = (name) => remote = workhole.import(name)
or remote = await workhole.expectExport(name)

4) call methods of imported object

console.log(await remote.add(2,3))
*/

const promises = {}
let id = 0

function workholeForwarder(worker, name, command, ...args) {
    id++

    return new Promise((resolve, reject) => {
        worker.postMessage({
            __workhole : true,
            action : "command",
            id, command, name, args
        })
    
        return promises[id] = {resolve, reject}
    })
}

export default class Workhole {
    exports = []
    imports = new Set()
    #waitingImports = {}
    
    constructor (worker, name = `workhole${++id}`) {
        this.worker = worker
        this.name = name
        
        worker.addEventListener("message", (event) => {
            if (!event.data.__workhole)
                return
            
            this.#processMessage(event.data)
        })
    }
    
    export(object, name) {
        if (typeof object !== "object")
            throw new Error(`Can only export objects`)
    
        if (name === undefined)
            throw new Error(`Can't export object without a name`)
        
        this.worker.postMessage({
            __workhole : true,
            action : "export",
            name
        })
        
        this.exports[name] = object
    }
    
    revoke(name) {
        this.worker.postMessage({
            __workhole : true,
            action : "revoke",
            name
        })
    
        delete this.exports[name]
    }
    
    import(name, promised = false) {
        return new Proxy({}, {
            get: (object, property) => {
                
                //if returned from promise, "then" is detected and executed
                //so we hide it for the first time
                if (property === "then" && promised) {
                    promised = false
                    return
                }
                
                return workholeForwarder.bind(object, this.worker, name, property)
            }
        })
    }
    
    expectExport(name) {
        if (this.imports.has(name))
            return Promise.resolve(this.import(name, true))
        
        return new Promise((resolve, reject) => {
            this.#waitingImports[name] = {resolve, reject}
        })
    }
    
    #processMessage(data) {
        if (data.action === "export") {
            this.imports.add(data.name)
            
            if (this.#waitingImports[data.name]) {
                this.#waitingImports[data.name].resolve(this.import(data.name, true))
                delete this.#waitingImports[data.name]
            }
            
            this.onexport(data.name)
            return
        }
    
        if (data.action === "revoke") {
            this.imports.delete(data.name)
            this.onrevoke(data.name)
            return
        }
    
        if (data.action === "command") {
            const object = this.exports[data.name]
            if (object === undefined)
                throw new Error (`"${this.name}" does not export "${data.name}"`)
        
            this.worker.postMessage({
                __workhole : true,
                action : "result",
                id : data.id,
                result : object[data.command].call(object, ...data.args)
            })
            return
        }
        
        if (data.action === "result") {
            promises[data.id]?.resolve(data.result)
            delete promises[data.id]
            return
        }
    }
    
    onexport(name) {}
    
    onrevoke(name) {}
}