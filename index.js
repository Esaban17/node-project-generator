#!/usr/bin/env node

// Imports
import fs from "fs";
import path from "path";
import {fileURLToPath} from 'url';
import inquirer from "inquirer";
import shell from "shelljs";
import chalk  from "chalk";
import render from './utils/template.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Obtener las opciones de los templates
const TEMPLATE_OPTIONS = fs.readdirSync(path.join(__dirname, 'templates'));
const CURRENT_DIRECTORY = process.cwd();

const QUESTIONS = [
    {
        name: 'template',
        type: 'list',
        message: '¿Qué tipo de proyecto quieres generar?',
        choices: TEMPLATE_OPTIONS
    },
    {
        name: 'project',
        type: 'input',
        message: '¿Cuál es el nombre del proyecto?',
        validate: function(input){
            if(/^([a-z@]{1}[a-z\-\.\\\/0-9]{0,213})+$/.test(input)){
                return true;
            }
            return 'El nombre del proyecto solo puede tener 214 carácteres y tiene que empezar con minúscula o con @'
        }
    },
];

inquirer.prompt(QUESTIONS).then((res) => {
    const template = res['template'];
    const project = res['project'];

    const templatePath = path.join(__dirname, 'templates', template);
    const pathTarget = path.join(CURRENT_DIRECTORY, project);
    if(!createProject(pathTarget)) return;

    copyDirectoryFilesContent(templatePath, project);
    postProcess(templatePath, pathTarget);
});


function createProject(projectPath){
    //Comprobar que no existe el directorio
    if(fs.existsSync(projectPath)) {
        console.log(chalk.red("No puedes crear el proyecto porque ya existe, intenta con otro nombre"));
    }
    fs.mkdirSync(projectPath);
    return true;
}

function copyDirectoryFilesContent(templatePath, projectName){
    const listFileDirectories = fs.readdirSync(templatePath);

    listFileDirectories.forEach(item => {
        const originalPath = path.join(templatePath, item);

        const stats = fs.statSync(originalPath);

        const writePath = path.join(CURRENT_DIRECTORY, projectName, item);

        if(stats.isFile()){
            let content = fs.readFileSync(originalPath, 'UTF-8');
            content = render(content, {projectName});
            fs.writeFileSync(writePath, content, 'UTF-8');

            const CREATE = chalk.green('CREATE');
            const size = stats['size'];

            console.log(`${CREATE} ${originalPath} (${size} bytes)`);

        }else if(stats.isDirectory()){
            fs.mkdirSync(writePath);
            copyDirectoryFilesContent(path.join(templatePath, item), path.join(projectName, item));
        }
    });
}

function postProcess(templatePath, targetPath){
    const isNode = fs.existsSync(path.join(templatePath, 'package.json'));

    if(isNode){
        shell.cd(targetPath);
        console.log(chalk.green(`Instalando las dependencias en ${targetPath}`));
        const result = shell.exec('npm install');
        if(result.code != 0){
            return false;
        }
    }
    
}