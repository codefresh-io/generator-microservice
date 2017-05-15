const
    _ = require('lodash'),
    YAML = require('json2yaml'),
    Generator = require('yeoman-generator');

const dockerDatabaseImageTemplate = (dbName)=> ({ "mongodb": "mongo", "mysql": "mysql" })[dbName] || dbName;

module.exports = class extends Generator {
    constructor(args, opts) {
        super(args, opts);
        this.option('port', {
            "description": "The port to use for health HTTP endpoint",
            "default": 8000,
            "type": Number,
            "alias": "p"
        });
    }
    prompting(){

        return this.prompt([{
            type: "input",
            name: "node_image_tag",
            message: "Which Node image would you like to use?",
            default: "onbuild",
            store: true
        }, {
            name: "database",
            type: "list",
            choices: [
                { name: "None (no composition)", value: undefined, short: "None" },
                { type: "separator", value: "----------" },
                { name: "mySQL", value: "mysql" },
                { name: "MongoDB", value: "mongodb" }
            ],
            message: "Which database would you like to include in your composition?",
            default: { value: "none" },
            store: true
        }, {
            name: "http_endpoint",
            type: "confirm",
            message: "Would you like to include a HTTP endpoint to be used for health checks?",
            default: false,
            store: true
        }, {
            type: "input",
            name: "output_image",
            message: "How would you like to name the new image to be created?",
            default: "myapp",
            store: true
        }]).then((answers)=> this.options = _.assign(this.options, answers))
    }
    writing() {

        let { node_image_tag, http_endpoint, output_image, database, port } = this.options;

        _(["Dockerfile", http_endpoint && "ping.js"]).compact().forEach((filename)=> {
            this.fs.copyTpl(
                this.templatePath(`${filename}.tpl`),
                this.destinationPath(filename),
                { node_image_tag, http_endpoint, port }
            );
        });

        this.fs.write(
            this.destinationPath('docker-compose.yml'),
            YAML.stringify(_.merge(
                this.fs.readJSON(this.templatePath('docker-compose.json')),
                {
                    "services": {
                        "app":
                            _.pickBy({
                                "image": output_image,
                                "links": database
                            }, Boolean)
                    }
                },
                database && {
                    "services": {
                        [database]: {
                            image: dockerDatabaseImageTemplate(database)
                        }
                    }
                }
            ))
        );
    }
    install(){
        let { http_endpoint } = this.options;
        http_endpoint && this.npmInstall(["express"], { "save": true });
    }
};