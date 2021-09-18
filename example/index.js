import Workhole from "../src/workhole.js"

const worker = new Worker("worker.js", {
    type: "module"
})

//wrap a worker into a Workhole
const workhole = new Workhole(worker)

const reporter = {
    bar : document.getElementById("progress"),
    text : document.getElementById("progress-text"),

    report(value) {
        const progress = `${Math.max(0, Math.min(value, 100)).toFixed(2)}%`
        this.bar.style.width = progress
        this.text.innerText = progress
    }
}

//export reporter
workhole.export(reporter, "reporter")

//wait for calculator to be exported
const calculator = await workhole.expectExport("calculator")

//
console.log(await calculator.calculate(100000000, 1000))