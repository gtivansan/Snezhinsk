let canvas = document.getElementById("canvas");
var svgNS = "http://www.w3.org/2000/svg";

function animate({timing, draw, duration, then}) {
    // Taken from http://learn.javascript.ru
    let start = performance.now();
    requestAnimationFrame(function animate(time) {
        // timeFraction изменяется от 0 до 1
        let timeFraction = (time - start) / duration;
        if (timeFraction > 1) timeFraction = 1;

        // вычисление текущего состояния анимации
        let progress = timing(timeFraction);

        draw(progress); // отрисовать её

        if (timeFraction < 1) {
          requestAnimationFrame(animate);
        } else {
            if (then) {then();}
        }
    });
}

function getRandomInt(max) {
      return Math.floor(Math.random() * Math.floor(max));
}

function linear(timeFraction) {
    return timeFraction;
}

async function getSnowflakesCount() {
    let response = await fetch("/getSnowflakesCount")
    return response.text()
}

let cashe = {};
async function getSnowflake(id) {
    if (!cashe[id]) {
        let response = await fetch("/getSnowflake?id=" + id);
        cashe[id] = response.json();
    }
    return cashe[id];
}

function launchSnowflake(snowflake, id) {
    let mask = snowflake.snowflake;
    let groupInnerHTML = `
        <clipPath id="${id}_masksContainer">${mask}</clipPath>
        <symbol id="${id}_flakeraw">
            <path d="M 134.06 450 L 365 50 L 365 450 Z"/>
        </symbol>   
        <symbol id="${id}_flakeangle">
            <use href="#${id}_flakeraw" fill="white" stroke-width="2" stroke="white"/>
            <use clip-path="url(#${id}_masksContainer)" href="#${id}_flakeraw" fill="black" stroke-width="15" stroke="black"/>
        </symbol>
        <symbol id="${id}_flakeshape" viewbox="-100 -350 1000 850">
            <rect x="-1000" y="-1000" width="3000" height="3000" fill="black"/>
            <g id="${id}_left">
                <use href="#${id}_flakeangle" transform="rotate(0, 365 50)"/>
                <use href="#${id}_flakeangle" transform="rotate(60, 365 50)"/>
                <use href="#${id}_flakeangle" transform="rotate(120, 365 50)"/>
                <use href="#${id}_flakeangle" transform="rotate(180, 365 50)"/>
                <use href="#${id}_flakeangle" transform="rotate(240, 365 50)"/>
                <use href="#${id}_flakeangle" transform="rotate(300, 365 50)"/>
            </g>
            <use href="#${id}_left" transform="scale(-1, 1)" x="-730">
        </symbol>
        <mask id="${id}_flakeMask">
            <use href="#${id}_flakeshape"/>
        </mask>
        <mask id="${id}_flakeangleMask">
            <rect x="0" y="0" width="500" height="500" fill="black"/>
            <use href="#${id}_flakeangle"/>
        </mask>
        <rect x="0" y="0" width="500" height="500" fill="#7373ff" mask="url(#${id}_flakeMask)"/>
    `
    let svg = document.createElementNS(svgNS, "svg");
    let maxSize = 120; let minSize = 50;
    let size = Math.random() * (maxSize - minSize) + minSize;
    let left = Math.random() * canvas.getBoundingClientRect().width;
    let angle = Math.random() * 800 - 400;
    svg.setAttribute("width", size);
    svg.setAttribute("height", size);
    svg.setAttribute("viewbox", "0 0 500 500");
    svg.style.position = "fixed";
    svg.innerHTML = groupInnerHTML;
    canvas.appendChild(svg);

    function draw(progress) {
        svg.style.top = `${progress * canvas.getBoundingClientRect().height}px`;
        svg.style.left = `${left}px`;
        svg.setAttribute("transform", `rotate(${angle * progress})`)
    }

    animate({
        timing: linear,
        draw,
        duration: 30000,
        then: () => {
            svg.remove();
        }
    })
}

document.addEventListener("DOMContentLoaded", main);

async function main() {
    let snowflakeCount = await getSnowflakesCount();
    let counter = 0;

    if (snowflakeCount >= 1) {
        setInterval(async function() {
            id = getRandomInt(snowflakeCount - 1) + 1;
            snowflake = await getSnowflake(id);
            launchSnowflake(snowflake, counter);
            counter += 1;
        }, 3000)
    }
}