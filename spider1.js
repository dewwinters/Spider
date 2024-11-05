// Define the requestAnimFrame function
window.requestAnimFrame = function () {
    // Check if the browser supports requestAnimFrame
    return (
        window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        // If none of these options are available, use setTimeout to call the callback function
        function (callback) {
            window.setTimeout(callback);
        }
    );
};

// Initialization function to get the canvas element and return relevant information
function init(elemid) {
    // Get the canvas element
    let canvas = document.getElementById(elemid);
    // Get the 2D drawing context (note the lowercase 'd')
    c = canvas.getContext('2d');
    // Set the canvas width to the window's inner width and height
    w = (canvas.width = window.innerWidth);
    h = (canvas.height = window.innerHeight);
    // Set the fill style to semi-transparent black
    c.fillStyle = "rgba(30,30,30,1)";
    // Fill the entire canvas with the fill style
    c.fillRect(0, 0, w, h);
    // Return the drawing context and canvas element
    return { c: c, canvas: canvas };
}

// Execute the function after the page has fully loaded
window.onload = function () {
    // Get the drawing context and canvas element
    let c = init("canvas").c,
        canvas = init("canvas").canvas,
        // Set the canvas width to the window's inner width and height
        w = (canvas.width = window.innerWidth),
        h = (canvas.height = window.innerHeight),
        // Initialize the mouse object
        mouse = { x: false, y: false },
        last_mouse = {};

    // Define a function to calculate the distance between two points
    function dist(p1x, p1y, p2x, p2y) {
        return Math.sqrt(Math.pow(p2x - p1x, 2) + Math.pow(p2y - p1y, 2));
    }

    // Define the segment class
    class segment {
        // Constructor to initialize segment objects
        constructor(parent, l, a, first) {
            // If it's the first segment, position coordinates are at the top of the tentacle
            // Otherwise, position coordinates are at the next segment's coordinates
            this.first = first;
            if (first) {
                this.pos = {
                    x: parent.x,
                    y: parent.y,
                };
            } else {
                this.pos = {
                    x: parent.nextPos.x,
                    y: parent.nextPos.y,
                };
            }
            // Set the segment's length and angle
            this.l = l;
            this.ang = a;
            // Calculate the next segment's coordinates
            this.nextPos = {
                x: this.pos.x + this.l * Math.cos(this.ang),
                y: this.pos.y + this.l * Math.sin(this.ang),
            };
        }
        // Method to update segment position
        update(t) {
            // Calculate the angle to the target point
            this.ang = Math.atan2(t.y - this.pos.y, t.x - this.pos.x);
            // Update position coordinates based on the target point and angle
            this.pos.x = t.x + this.l * Math.cos(this.ang - Math.PI);
            this.pos.y = t.y + this.l * Math.sin(this.ang - Math.PI);
            // Update the nextPos coordinates based on the new position
            this.nextPos.x = this.pos.x + this.l * Math.cos(this.ang);
            this.nextPos.y = this.pos.y + this.l * Math.sin(this.ang);
        }
        // Method to reset the segment to its initial position
        fallback(t) {
            // Set position coordinates to the target point's coordinates
            this.pos.x = t.x;
            this.pos.y = t.y;
            this.nextPos.x = this.pos.x + this.l * Math.cos(this.ang);
            this.nextPos.y = this.pos.y + this.l * Math.sin(this.ang);
        }
        show() {
            c.lineTo(this.nextPos.x, this.nextPos.y);
        }
    }

    // Define the tentacle class
    class tentacle {
        // Constructor to initialize tentacle objects
        constructor(x, y, l, n, a) {
            // Set the top position coordinates of the tentacle
            this.x = x;
            this.y = y;
            // Set the tentacle's length
            this.l = l;
            // Set the number of segments
            this.n = n;
            // Initialize the target point object for the tentacle
            this.t = {};
            // Set a random parameter for the tentacle's movement
            this.rand = Math.random();
            // Create the first segment of the tentacle
            this.segments = [new segment(this, this.l / this.n, 0, true)];
            // Create the other segments
            for (let i = 1; i < this.n; i++) {
                this.segments.push(
                    new segment(this.segments[i - 1], this.l / this.n, 0, false)
                );
            }
        }
        // Method to move the tentacle to the target point
        move(last_target, target) {
            // Calculate the angle from the top of the tentacle to the target point
            this.angle = Math.atan2(target.y - this.y, target.x - this.x);
            // Calculate the distance parameter for the tentacle
            this.dt = dist(last_target.x, last_target.y, target.x, target.y);
            // Calculate the target point coordinates for the tentacle
            this.t = {
                x: target.x - 0.8 * this.dt * Math.cos(this.angle),
                y: target.y - 0.8 * this.dt * Math.sin(this.angle)
            };
            // If a target point was calculated, update the last segment's position
            // Otherwise, update the last segment's position to the target point coordinates
            if (this.t.x) {
                this.segments[this.n - 1].update(this.t);
            } else {
                this.segments[this.n - 1].update(target);
            }
            // Iterate over all segment objects, updating their position
            for (let i = this.n - 2; i >= 0; i--) {
                this.segments[i].update(this.segments[i + 1].pos);
            }
            if (
                dist(this.x, this.y, target.x, target.y) <=
                this.l + dist(last_target.x, last_target.y, target.x, target.y)
            ) {
                this.segments[0].fallback({ x: this.x, y: this.y });
                for (let i = 1; i < this.n; i++) {
                    this.segments[i].fallback(this.segments[i - 1].nextPos);
                }
            }
        }
        show(target) {
            // If the distance from the tentacle to the target is less than its length, reset the tentacle
            if (dist(this.x, this.y, target.x, target.y) <= this.l) {
                // Set the global composite operation to 'lighter'
                c.globalCompositeOperation = "lighter";
                // Begin a new path
                c.beginPath();
                // Start drawing lines from the tentacle's starting position
                c.moveTo(this.x, this.y);
                // Iterate over all segment objects and use their show method to draw lines
                for (let i = 0; i < this.n; i++) {
                    this.segments[i].show();
                }
                // Set the line style
                c.strokeStyle = "hsl(" + (this.rand * 60 + 180) +
                    ",100%," + (this.rand * 60 + 25) + "%)";
                // Set the line width
                c.lineWidth = this.rand * 2;
                // Set line cap style
                c.lineCap = "round";
                // Set line join style
                c.lineJoin = "round";
                // Draw the lines
                c.stroke();
                // Set the global composite operation back to 'source-over'
                c.globalCompositeOperation = "source-over";
            }
        }
        // Method to draw the circular head of the tentacle
        show2(target) {
            // Start a new path
            c.beginPath();
            // If the distance from the tentacle to the target is less than its length, draw a white circle
            // Otherwise, draw a dark cyan circle
            if (dist(this.x, this.y, target.x, target.y) <= this.l) {
                c.arc(this.x, this.y, 2 * this.rand + 1, 0, 2 * Math.PI);
                c.fillStyle = "whith";
            } else {
                c.arc(this.x, this.y, this.rand * 2, 0, 2 * Math.PI);
                c.fillStyle = "darkcyan";
            }
            // Fill the circle
            c.fill();
        }
    }

    // Initialize variables
    let maxl = 400, // Maximum length of tentacles
        minl = 50, // Minimum length of tentacles
        n = 30, // Number of segments in each tentacle
        numt = 600, // Number of tentacles
        tent = [], // Array of tentacles
        clicked = false, // Whether the mouse is pressed
        target = { x: 0, y: 0 }, // Target point for the tentacles
        last_target = {}, // Last target point for the tentacles
        t = 0, // Current time
        q = 10; // Step size for tentacle movement

    // Create tentacle objects
    for (let i = 0; i < numt; i++) {
        tent.push(
            new tentacle(
                Math.random() * w, // x-coordinate of the tentacle
                Math.random() * h, // y-coordinate of the tentacle
                Math.random() * (maxl - minl) + minl, // Length of the tentacle
                n, // Number of segments
                Math.random() * 2 * Math.PI // Angle of the tentacle
            )
        );
    }
    // Method to draw the image
    function draw() {
        // If the mouse is moving, calculate the offset for the target point
        if (mouse.x) {
            target.errx = mouse.x - target.x;
            target.erry = mouse.y - target.y;
        } else {
            // Otherwise, calculate the x-coordinate for the target point
            target.errx =
                w / 2 +
                ((h / 2 - q) * Math.sqrt(2) * Math.cos(t)) /
                (Math.pow(Math.sin(t), 2) + 1) -
                target.x;
            target.erry =
                h / 2 +
                ((h / 2 - q) * Math.sqrt(2) * Math.cos(t) * Math.sin(t)) /
                (Math.pow(Math.sin(t), 2) + 1) -
                target.y;
        }

        // Update the target point coordinates
        target.x += target.errx / 10;
        target.y += target.erry / 10;

        // Update time
        t += 0.01;

        // Draw the target point for the tentacles
        c.beginPath();
        c.arc(
            target.x,
            target.y,
            dist(last_target.x, last_target.y, target.x, target.y) + 5,
            0,
            2 * Math.PI
        );
        c.fillStyle = "hsl(210,100%,80%)";
        c.fill();

        // Draw the center points of all the tentacles
        for (i = 0; i < numt; i++) {
            tent[i].move(last_target, target);
            tent[i].show2(target);
        }
        // Draw all the tentacles
        for (i = 0; i < numt; i++) {
            tent[i].show(target);
        }
        // Update the last target point coordinates
        last_target.x = target.x;
        last_target.y = target.y;
    }
    // Function to continuously execute the drawing animation
    function loop() {
        // Use requestAnimFrame to loop the execution
        window.requestAnimFrame(loop);

        // Clear the canvas
        c.clearRect(0, 0, w, h);

        // Draw the animation
        draw();
    }

    // Listen for window resize events
    window.addEventListener("resize", function () {
        // Reset the canvas size
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;

        // Call the loop function to continue the animation
        loop();
    });

    // Call the loop function to start the animation
    loop();
    // Use setInterval to repeat
    setInterval(loop, 1000 / 60);

    // Listen for mouse move events
    canvas.addEventListener("mousemove", function (e) {
        // Record the last mouse position
        last_mouse.x = mouse.x;
        last_mouse.y = mouse.y;

        // Update the current mouse position
        mouse.x = e.pageX - this.offsetLeft;
        mouse.y = e.pageY - this.offsetTop;
    }, false);

    // Listen for mouse leave events
    canvas.addEventListener("mouseleave", function (e) {
        // Set mouse to false
        mouse.x = false;
        mouse.y = false;
    });
};