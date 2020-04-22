#!/usr/bin/env node

// los imports
const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const shell = require('shelljs');
const chalk = require('chalk');
const render = require('./utils/templstes').render;

// obtener las opciones de los templates

const TEMPLATES_OPTIONS = fs.readdirSync(path.join(__dirname, 'templates'));
//console.log(TEMPLATES_OPTIONS);

const QUESTIONS = [
    {
        name: 'template',
        type: 'list',
        message: '¿Qué tipo de proyecto quieres gererar?',
        choices: TEMPLATES_OPTIONS
    },
    {
        name: 'proyecto',
        type: 'input',
        message: '¿Cuál es el nombre del proyecto?',
        validate: function (input) {
            if (/^([a-z@]{1}[a-z\-\.\\\/0-9]{0,213})+$/.test(input)) {
                return true;
            }
            return 'El nombre del proyecto solo puede tener 214 carácteres y tiene que empezar en minúsculas o con una arroba';
        }
    },
]

//console.log(QUESTIONS);
const DIR_ACTUAL = process.cwd();
inquirer.prompt(QUESTIONS).then(response => {
    const template = response['template'];
    const proyecto = response['proyecto'];
    const templatePaht = path.join(__dirname, 'templates', template);
    const pathTarget = path.join(DIR_ACTUAL, proyecto);
    if(!crateProyect(pathTarget)){
        return;
    }
    createDirectoriesFilesContent(templatePaht, proyecto);
    postProcces(templatePaht, pathTarget);
});

function crateProyect(proyectPath) {
    // comprobar que no existe el directorio
    if (fs.existsSync(proyectPath)) {
        console.log(chalk.red('Ya existe proyecto, volver a intentar'));
        return false;
    }
    fs.mkdirSync(proyectPath);
    return true;
}

function createDirectoriesFilesContent(templatePaht, projectName) {
    const listFileDirectories = fs.readdirSync(templatePaht);
    listFileDirectories.forEach(item => {
        const originalPath = path.join(templatePaht, item);
        const stats = fs.statSync(originalPath);
        const writePath = path.join(DIR_ACTUAL, projectName, item);
        if (stats.isFile()) {
            let contents = fs.readFileSync(originalPath, 'utf-8');
            contents = render(contents,{projectName});
            fs.writeFileSync(writePath, contents, 'utf-8');
            //informacion adicional
            const CREATE = chalk.green('CREATE ');
            const size = stats['size'];
            console.log(`${CREATE} ${originalPath} (${size} bytes)`);
        } else if (stats.isDirectory()) {
            fs.mkdirSync(writePath);
            createDirectoriesFilesContent(path.join(templatePaht,item),path.join(projectName,item));
        }
    })
}

function postProcces(templatePath, targetPath){
    const isNode = fs.existsSync(path.join(templatePath, 'package.json'));
    //console.log(isNode);
    if (isNode){
        shell.cd(targetPath);
        console.log(chalk.green(`Instalando las dependencias en ${targetPath}`));
        const result = shell.exec('npm install');
        if (result.code != 0){
            return false;
        }
    }
}
