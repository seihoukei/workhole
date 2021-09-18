import Workhole from "../src/workhole.js"

//wrap self into a Workhole
const workhole = new Workhole(self)

class Calculator {
    constructor(reporter) {
        this.reporter = reporter
    }

    calculate(max, step = Math.max(10000, max / 100)) {
        let result = 0
        let nextStep = step
        for (let i = 0; i < max; i++) {
            if (i > nextStep) {
                nextStep += step
                this.reporter.report(i / max * 100)
            }
            result += i ** 2
        }
        this.reporter.report(100)
        return result
    }
}

//wait for reporter to be exported
const reporter = await workhole.expectExport("reporter")

const calculator = new Calculator(reporter)

//export calculator
workhole.export(calculator,"calculator")
