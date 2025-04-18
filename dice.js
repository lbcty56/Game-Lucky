import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

/**
 * Dice class that creates and manages a 3D dice with animation and interaction capabilities
 * Uses Three.js for 3D rendering and canvas for dice face textures
 */
class Dice3D {
  constructor() {

    // Configuration parameters for the dice and its environment
    this.params = {
      // Lighting configuration
      ambientLightBrightness: 0.5,
      directionalLightBrightness: 2.5,
      directionalLightPosition: { x: 1, y: 1, z: 5 },

      // Camera configuration
      cameraPosition: { x: 0, y: 0, z: 1.9 },
      cameraLookAt: { x: 0, y: 0, z: 0 },

      // Dice geometry configuration
      roundDiceGeometry: {
        width: 1,
        height: 1,
        depth: 1,
        segments: 2,
        radius: 0.2
      },

      // Animation configuration
      animationSpeed: 0.1,
      minAnimationDuration: 1300, // 1.3 seconds

      // Dice face pixels configuration
      canvasWidth: 512,
      canvasHeight: 512,

      // Dice dot size configuration
      dotRadius: {
        1: 80,
        2: 48,
        3: 48,
        4: 48,
        5: 48,
        6: 48
      },
      // Positions of dots for each face (1-6)
      dotPositions: {
        1: [[256, 256]],
        2: [[160, 160], [352, 352]],
        3: [[128, 128], [256, 256], [384, 384]],
        4: [[160, 160], [160, 352], [352, 160], [352, 352]],
        5: [[128, 128], [128, 384], [256, 256], [384, 128], [384, 384]],
        6: [[160, 128], [160, 256], [160, 384], [352, 128], [352, 256], [352, 384]]
      }
    };

    // Private property to store the dice value
    this._diceValue = 0;

    // Animation state variables
    this.isAnimating = false;
    this.animationStartTime = 0;
    this.targetRotationX = 0;
    this.targetRotationY = 0;


    // Three.js scene setup
    this.scene = new THREE.Scene();

    // Set up camera
    this.camera = new THREE.PerspectiveCamera( 45, 1, 0.1, 1000 );
    this.camera.position.set(
      this.params.cameraPosition.x,
      this.params.cameraPosition.y,
      this.params.cameraPosition.z
    );
    this.camera.lookAt(
      this.params.cameraLookAt.x,
      this.params.cameraLookAt.y,
      this.params.cameraLookAt.z
    );

    // Set up renderer
    this.renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );
    this.renderer.setSize( 130, 130 ); // Match the CSS dimensions
    this.renderer.setClearColor( '#000000', 0 ); // Transparent background
    document.body.appendChild( this.renderer.domElement );

    // Add lighting
    const ambientLight = new THREE.AmbientLight( '#ffffff', this.params.ambientLightBrightness );
    this.scene.add( ambientLight );

    const directionalLight = new THREE.DirectionalLight( '#ffffff', this.params.directionalLightBrightness );
    directionalLight.position.set(
      this.params.directionalLightPosition.x,
      this.params.directionalLightPosition.y,
      this.params.directionalLightPosition.z
    ).normalize();
    this.scene.add( directionalLight );


    // Create materials for each face with dots
    const materials = [];
    // Create materials in the correct order for a standard die
    // The order is: right, left, top, bottom, front, back
    const faceOrder = [2, 5, 3, 4, 1, 6];

    for ( let faceIndex = 0; faceIndex < 6; faceIndex++ ) {
      const faceValue = faceOrder[faceIndex];
      // Create a canvas for this face
      const canvas = document.createElement( 'canvas' );
      canvas.width = this.params.canvasWidth;
      canvas.height = this.params.canvasHeight;
      const context = canvas.getContext( '2d' );

      // Enable image smoothing for better quality
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';

      // Background color
      context.fillStyle = '#ffffff';
      context.fillRect( 0, 0, this.params.canvasWidth, this.params.canvasHeight );
      // Face 1 is red
      context.fillStyle = faceValue === 1 ? '#ff0000' : '#000000';

      // Draw dots for the current face
      this.params.dotPositions[faceValue].forEach( ( [x, y] ) => {
        context.beginPath();
        context.arc( x, y, this.params.dotRadius[faceValue], 0, Math.PI * 2 );
        context.fill();
      } );

      // Create the material with the canvas texture
      const texture = new THREE.CanvasTexture( canvas );
      // Quality enhancement
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;

      const material = new THREE.MeshStandardMaterial( {
        map: texture,
        metalness: 0.1,
        roughness: 1,
      } );

      materials.push( material );
    }


    // Set up rounded dice geometry
    const geometry = new RoundedBoxGeometry(
      this.params.roundDiceGeometry.width,
      this.params.roundDiceGeometry.height,
      this.params.roundDiceGeometry.depth,
      this.params.roundDiceGeometry.segments,
      this.params.roundDiceGeometry.radius
    );
    this.dice = new THREE.Mesh( geometry, materials );
    this.scene.add( this.dice );


    // Raycasting for click detection
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // Add click event listener
    this.renderer.domElement.addEventListener( 'click', ( event ) => {
      this.handleClick( event );
    } );

    // Start animation loop
    this.renderer.setAnimationLoop( () => {
      this.animate();
      this.renderer.render( this.scene, this.camera );
    } );

    // Add callback for roll completion
    this.onRollComplete = null;
  }

  /**
   * Getter for the current dice value
   * @returns {number} The current value of the dice (1-6)
   */
  get diceValue () {
    return this._diceValue;
  }

  /**
   * Setter for the current dice value
   * @param {number} value - The new value to set (1-6)
   */
  set diceValue ( value ) {
    this._diceValue = value;
  }

  /**
   * Handles click events on the dice
   * @param {MouseEvent} event - The click event
   */
  handleClick ( event ) {
    // Calculate mouse position in normalized device coordinates
    this.mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    this.mouse.y = -( event.clientY / window.innerHeight ) * 2 + 1;

    // Update the picking ray with the camera and mouse position
    this.raycaster.setFromCamera( this.mouse, this.camera );

    // Calculate objects intersecting the picking ray
    const intersects = this.raycaster.intersectObject( this.dice, true );

    if ( intersects.length > 0 && !this.isAnimating ) {
      this.rollDice();
    }
  }

  /**
   * Initiates the dice roll animation
   */
  rollDice () {

    // Predefined rotation angles for each face (1-6)
    const rotateFaceAngleX = [0, 90, 0, 0, -90, 180];
    const rotateFaceAngleY = [0, 0, -90, 90, 0, 0];

    // Normalize current rotation first
    this.dice.rotation.x = THREE.MathUtils.euclideanModulo( this.dice.rotation.x, Math.PI * 2 );
    this.dice.rotation.y = THREE.MathUtils.euclideanModulo( this.dice.rotation.y, Math.PI * 2 );

    // Generate a random number between 1 and 6
    const randomNumber = Math.floor( Math.random() * 6 ) + 1;

    // Add some randomization to the animation (whole rotations)
    const spinCount = Math.floor( Math.random() * 3 + 3 ) * 360; // 3-5 full spins

    // Get the rotation angles for the selected face
    this.targetRotationX = THREE.MathUtils.degToRad( rotateFaceAngleX[randomNumber - 1] + spinCount );
    this.targetRotationY = THREE.MathUtils.degToRad( rotateFaceAngleY[randomNumber - 1] + spinCount );

    this.isAnimating = true;
    this.animationStartTime = performance.now();
    this.diceValue = randomNumber;

    // Add callback when animation completes
    this.onAnimationComplete = () => {
      if ( this.onRollComplete ) {
        this.onRollComplete( this.diceValue );
      }
    };
  }

  /**
   * Handles the dice animation
   */
  animate () {
    if ( this.isAnimating ) {
      const currentTime = performance.now();
      const elapsedTime = currentTime - this.animationStartTime;
      const progress = Math.min( elapsedTime / this.params.minAnimationDuration, 1 );

      // Easing function for smoother animation
      const easeProgress = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow( -2 * progress + 2, 2 ) / 2;

      // Smoothly interpolate current rotation to target rotation
      this.dice.rotation.x += ( this.targetRotationX - this.dice.rotation.x ) * this.params.animationSpeed * easeProgress;
      this.dice.rotation.y += ( this.targetRotationY - this.dice.rotation.y ) * this.params.animationSpeed * easeProgress;

      // Check if we're close enough to the target rotation and minimum duration has passed
      if ( Math.abs( this.dice.rotation.x - this.targetRotationX ) < 0.01 &&
        Math.abs( this.dice.rotation.y - this.targetRotationY ) < 0.01 &&
        elapsedTime >= this.params.minAnimationDuration ) {
        this.dice.rotation.x = this.targetRotationX;
        this.dice.rotation.y = this.targetRotationY;
        this.isAnimating = false;
        if ( this.onAnimationComplete ) {
          this.onAnimationComplete();
        }
      }
    }
  }
}

export default Dice3D;