
    import * as bz from '../..';

    /** ****************************************************************************************************************
    *   Represents a custom stage set.
    *******************************************************************************************************************/
    export class Stage
    {
        /** The scene that represents this stage. */
        private             readonly        scene                   :bz.Scene                               = null;
        /** The canvas system this stage is displayed on. */
        private             readonly        canvas                  :bz.CanvasSystem                        = null;

        /** Specifies the ambient color of the babylon.JS scene and is set as the emissive color of all faces. */
        private             readonly        ambientColor            :BABYLON.Color3                         = null;
        /** The clear color of this stage is the background color of all mesh materials. */
        private             readonly        clearColor              :BABYLON.Color4                         = null;
        /** The initial camera to set for this stage. */
        private             readonly        initialCamera           :bz.CameraType                          = null;
        /** A collection of all debug meshes in this stage. */
        private             readonly        debugMeshes             :BABYLON.Mesh[]                         = [];

        /** The player instance. */
        private                             player                  :bz.Player                              = null;
        /** A collection of all walls in this stage. */
        private                             walls                   :bz.Wall[]                              = [];
        /** The soil is the diggable area for the stage. */
        private                             soil                    :bz.Soil[][]                            = null;
        /** The soil backgrounds are displayed behind the soil blocks. */
        private                             soilBg                  :bz.Wall[][]                            = null;

        /** A reference to the elevator wall. */
        private                             elevator                :bz.Wall                                = null;
        /** The current position of the elevator. */
        private                             elevatorPosition        :BABYLON.Vector3                        = null;

        /** The game GUI. */
        private                             gui                     :bz.GUI                                 = null;
        /** The camera system that manages all scene cameras. */
        private                             cameraSystem            :bz.CameraSystem                        = null;

        /** The skybox that surrounds the whole stage. */
        private                             skybox                  :BABYLON.Mesh                           = null;

        /** Indicates pause state. */
        private                             pause                   :boolean                                = false;

        /** ************************************************************************************************************
        *   Creates a new custom stage.
        *
        *   @param scene         The scene representing this stage.
        *   @param canvas        The canvas system this stage is displayed on.
        *
        *   @param ambientColor  Specifies the ambient color of the babylon.JS scene
        *                        and is set as the emissive color of all faces.
        *   @param clearColor    The clear color of the stage is the background color of the scene.
        *   @param initialCamera The initial camera for this stage.
        ***************************************************************************************************************/
        public constructor
        (
            scene         :bz.Scene,
            canvas        :bz.CanvasSystem,
            ambientColor  :BABYLON.Color3 = bz.SettingColor.COLOR_RGB_WHITE,
            clearColor    :BABYLON.Color4 = bz.SettingColor.COLOR_RGBA_WHITE_OPAQUE,
            initialCamera :bz.CameraType  = bz.CameraType.FIRST_PERSON
        )
        {
            this.scene         = scene;
            this.canvas        = canvas;

            this.ambientColor  = ambientColor;
            this.clearColor    = clearColor;
            this.initialCamera = initialCamera;
        }

        /** ************************************************************************************************************
        *   Inits the stage.
        ***************************************************************************************************************/
        public init() : void
        {
            // set ambient color and scene bg color
            this.scene.getNativeScene().ambientColor = this.ambientColor;
            this.scene.getNativeScene().clearColor   = this.clearColor;

            // create all game objects
            this.player        = this.createPlayer();
            this.cameraSystem  = this.createCameraSystem();
            this.walls         = this.createWalls();
            this.soil          = this.createSoil();
            this.soilBg        = this.createSoilBg();
            this.skybox        = this.createSkybox();
            this.gui           = this.createGUI();

            // this.cameraSystem.testPostProcessing();

            this.elevatorPosition = new BABYLON.Vector3( ( bz.SettingGame.LEVEL_SIZE_X - 1 ), 0, 0 );

            // set camera system
            this.setActiveCamera( this.initialCamera );

            // create debug axis
            if ( bz.SettingDebug.DEBUG_COORDINATE_AXIS_ENABLED )
            {
                this.createCoordinalAxis();
            }

            // adjust GUI size
            this.adjustGuiSizeToCanvasSize();

            // invoke init complete callback
            this.onInitComplete();
        }

        /** ************************************************************************************************************
        *   Returns the player instance.
        *
        *   @return The player instance.
        ***************************************************************************************************************/
        public getPlayer() : bz.Player
        {
            return this.player;
        }

        /** ************************************************************************************************************
        *   Returns the native babylon.JS scene.
        *
        *   @return The player instance.
        ***************************************************************************************************************/
        public getScene() : BABYLON.Scene
        {
            return this.scene.getNativeScene();
        }

        /** ************************************************************************************************************
        *   Returns this stage's camera system.
        *
        *   @return The camera system of this stage.
        ***************************************************************************************************************/
        public getCameraSystem() : bz.CameraSystem
        {
            return this.cameraSystem;
        }

        /** ************************************************************************************************************
        *   Renders all stage concernings for one tick of the game loop.
        ***************************************************************************************************************/
        public render() : void
        {
            // consider pause
            if ( !this.pause )
            {
                // handle level specific keys
                Stage.handleLevelKeys();

                // render player
                if ( this.player !== null )
                {
                    this.player.render();
                }

                // render walls
                for ( const wall of this.walls )
                {
                    wall.render();
                }

                // render soil
                for ( const soilCol of this.soil )
                {
                    for ( const soil of soilCol )
                    {
                        soil.render();
                    }
                }

                // render soil bg
                for ( const soilBgCol of this.soilBg )
                {
                    for ( const soilBg of soilBgCol )
                    {
                        soilBg.render();
                    }
                }
            }

            // render GUI
            this.gui.render( this.pause );
        }

        /** ************************************************************************************************************
        *   Disposes all babylon.JS resources of this level.
        ***************************************************************************************************************/
        public dispose() : void
        {
            // dispose player
            if ( this.player !== null )
            {
                this.player.dispose();
            }

            // dispose all walls
            for ( const wall of this.walls )
            {
                wall.dispose();
            }

            // dispose soil
            for ( const soilCol of this.soil )
            {
                for ( const soil of soilCol )
                {
                    soil.dispose();
                }
            }

            // dispose soil bg
            for ( const soilBgCol of this.soilBg )
            {
                for ( const soilBg of soilBgCol )
                {
                    soilBg.dispose();
                }
            }

            // dispose all debug meshes
            for ( const debugLine of this.debugMeshes )
            {
                debugLine.dispose();
            }

            // dispose skybox
            if ( this.skybox !== null )
            {
                this.skybox.dispose();
            }

            // dispose camera system
            this.cameraSystem.dispose();

            // dispose GUI
            this.gui.dispose();
        }

        /** ************************************************************************************************************
        *   Sets the active camera for this stage.
        ***************************************************************************************************************/
        public setActiveCamera( cameraId:bz.CameraType ) : void
        {
            this.cameraSystem.setActiveCamera( cameraId );
        }

        /** ************************************************************************************************************
        *   Resizes fg and bg GUIs so they fit the current canvas size.
        ***************************************************************************************************************/
        public adjustGuiSizeToCanvasSize() : void
        {
            this.gui.updateSize
            (
                this.canvas.getWidth(),
                this.canvas.getHeight()
            );
        }

        /** ************************************************************************************************************
        *   Toggles the stage to the pause state or vice versa.
        ***************************************************************************************************************/
        public togglePause() : void
        {
            // toggle pause
            this.pause = !this.pause;

            bz.Debug.game.log(
                'Toggle pause to ['
                + String( this.pause )
                + ']'
            );

            // stop or resume physics engine
            // this.scene.enablePhysics( !this.pause );

            // propagate pause state to gui
            this.setGuiPause();
        }

        /** ************************************************************************************************************
        *   Updates the position for the stationary camera.
        ***************************************************************************************************************/
        public updateCameraPosition() : void
        {
            this.cameraSystem.animateCameraPositionTo
            (
                bz.CameraType.FREE_CAMERA,
                new BABYLON.Vector3(
                    ( this.player.getPosition().x + 0.5 ) * bz.SettingGame.TILE_SIZE_X,
                    ( this.player.getPosition().y + 0.5 ) * bz.SettingGame.TILE_SIZE_Y,
                    bz.SettingGame.CAMERA_DISTANCE_Z
                ),
                bz.SettingEngine.FRAMES_MINER_WALK
            );

            this.cameraSystem.animateCameraPositionTo
            (
                bz.CameraType.STATIONARY,
                new BABYLON.Vector3(
                    ( this.player.getPosition().x + 0.5 ) * bz.SettingGame.TILE_SIZE_X,
                    ( this.player.getPosition().y + 0.5 ) * bz.SettingGame.TILE_SIZE_Y,
                    bz.SettingGame.CAMERA_DISTANCE_Z
                ),
                bz.SettingEngine.FRAMES_MINER_WALK
            );

            this.cameraSystem.animateCameraPositionTo
            (
                bz.CameraType.FIRST_PERSON,
                new BABYLON.Vector3(
                    0.0, // ( this.player.getPosition().x + 0.5 ) * bz.SettingGame.TILE_SIZE_X,
                    0.0, // ( this.player.getPosition().y + 0.5 ) * bz.SettingGame.TILE_SIZE_Y,
                    bz.SettingGame.CAMERA_DISTANCE_Z
                ),
                bz.SettingEngine.FRAMES_MINER_WALK
            );
        }

        /** ************************************************************************************************************
        *   Returns the soil block on the specified player position.
        *
        *   @return The soil the player is located on.
        *           <code>null</code> if no soil is present on the player's position.
        ***************************************************************************************************************/
        public getSoilOnPlayerPosition( playerPosition:BABYLON.Vector3 ) : bz.Soil
        {
            // check if player is inside the soil area
            if (
                playerPosition.x >= 0
                && ( playerPosition.x < bz.SettingGame.LEVEL_SIZE_X - 1 )
                && playerPosition.y > bz.SettingEngine.SOIL_OFFSET_Y - bz.SettingGame.SOIL_SIZE_Y
                && playerPosition.y <= bz.SettingEngine.SOIL_OFFSET_Y
            ) {
                const soilX :number  = playerPosition.x;
                const soilY :number  = ( -playerPosition.y + bz.SettingEngine.SOIL_OFFSET_Y );

                return this.soil[ soilX ][ soilY ];
            }

            return null;
        }

        /** ************************************************************************************************************
        *   Sets the new position for the Elevator mesh object.
        ***************************************************************************************************************/
        public setElevatorMeshPosition( position:BABYLON.Vector3 ) : void
        {
            const elevatorMesh :BABYLON.AbstractMesh = this.elevator.getModel().getMesh( 0 );

            bz.MeshManipulation.setPosition(
                elevatorMesh,
                new BABYLON.Vector3(
                    position.x,
                    ( position.y - bz.SettingGame.TILE_SIZE_Y ),
                    ( 1.5 * bz.SettingGame.TILE_SIZE_Z )
                )
            );
        }

        /** ************************************************************************************************************
        *   Sets the new position for the Elevator.
        ***************************************************************************************************************/
        public setElevatorPosition( position:BABYLON.Vector3 ) : void
        {
            this.elevatorPosition = position;
        }

        /** ************************************************************************************************************
        *   Delivers the current position for the Elevator.
        ***************************************************************************************************************/
        public getElevatorPosition() : BABYLON.Vector3
        {
            return this.elevatorPosition;
        }

        /** ************************************************************************************************************
        *   Checks if soil hints shall be triggered.
        ***************************************************************************************************************/
        public checkTriggeringSoilHints( pos:BABYLON.Vector3 ) : void
        {
            // only if player is below ground and not in the elevator column
            if (
                this.player.getPosition().y > bz.SettingEngine.SOIL_OFFSET_Y
                || this.player.getPosition().x === ( bz.SettingGame.LEVEL_SIZE_X - 1 )
            ) {
                return;
            }

            bz.Debug.soil.log( 'Show soil hints for ' + String( pos ) );

            const soilDown  :bz.Soil = this.getSoilOnPlayerPosition(
                this.player.getPosition().clone().addInPlaceFromFloats( 0.0,  -1.0,  0.0 )
            );
            const soilUp    :bz.Soil = this.getSoilOnPlayerPosition(
                this.player.getPosition().clone().addInPlaceFromFloats( 0.0,  1.0, 0.0 )
            );
            const soilLeft  :bz.Soil = this.getSoilOnPlayerPosition(
                this.player.getPosition().clone().addInPlaceFromFloats( -1.0, 0.0,  0.0 )
            );
            const soilRight :bz.Soil = this.getSoilOnPlayerPosition(
                this.player.getPosition().clone().addInPlaceFromFloats( 1.0,  0.0,  0.0 )
            );

            const surroundedSoils:bz.Soil[] = [];
            if ( soilDown  !== null ) { surroundedSoils.push( soilDown  ); }
            if ( soilUp    !== null ) { surroundedSoils.push( soilUp    ); }
            if ( soilLeft  !== null ) { surroundedSoils.push( soilLeft  ); }
            if ( soilRight !== null ) { surroundedSoils.push( soilRight ); }

            bz.Debug.soil.log( ' [' + String( surroundedSoils.length ) + '] surrounded soils found' );

            for ( const soil of surroundedSoils )
            {
                // check if soil is present, still closed and not empty
                if ( soil !== null && soil.isClosed() && !soil.containsNothing() )
                {
                    // show soil hint randomly
                    if ( bz.MathUtil.getRandomInt( 1, bz.SettingGame.SOIL_HINT_LUCK_MAX_RANDOM ) === 1 )
                    {
                        soil.triggerSoilHint();
                    }
                }
            }
        }

        /** ************************************************************************************************************
        *   Sets up the player for this stage.
        *
        *   @return The player instance for this stage.
        ***************************************************************************************************************/
        private createPlayer() : bz.Player
        {
            return new bz.Player
            (
                this,
                this.scene,
                new BABYLON.Vector3( bz.SettingGame.PLAYER_START_X, 0.0, 0.0 ),
                this.ambientColor
            );
        }

        /** ************************************************************************************************************
        *   Creates the camera system that manages all cameras that appear in this level.
        *
        *   @return The camera system for this stage.
        ***************************************************************************************************************/
        private createCameraSystem() : bz.CameraSystem
        {
            return new bz.CameraSystem
            (
                this.scene.getNativeScene(),
                this.canvas.getNativeCanvas(),

                new BABYLON.Vector3(
                    ( this.player.getPosition().x + 0.5 ) * 1.6,
                    ( this.player.getPosition().y + 0.5 ) * 2.5,
                    bz.SettingGame.CAMERA_DISTANCE_Z
                ),
                new BABYLON.Vector3(
                    ( this.player.getPosition().x + 0.5 ) * 1.6,
                    ( this.player.getPosition().y + 0.5 ) * 2.5,
                    bz.SettingGame.CAMERA_DISTANCE_Z
                ),
                new BABYLON.Vector3(
                    0.0,
                    0.0,
                    0.0
                ),
                new BABYLON.Vector3(
                    0.0,
                    0.0,
                    bz.SettingGame.CAMERA_DISTANCE_Z
                ),
                this.player.getThirdPersonCameraTargetMesh(),
                this.player.getThirdPersonCameraTargetMesh(),
                this.player.getThirdPersonCameraTargetMesh(),
                this.player.getFirstPersonCameraTargetMesh()
            );
        }

        /** ************************************************************************************************************
        *   Creates and returns the soil wall blocks for this stage.
        *
        *   @return All soil walls of this stage.
        ***************************************************************************************************************/
        private createSoil() : bz.Soil[][]
        {
            const soil :bz.Soil[][] = [];

            for ( let x :number = 0; x < ( bz.SettingGame.LEVEL_SIZE_X - 1 ); ++x )
            {
                const soilCol :bz.Soil[] = [];

                for ( let y :number = 0; y < ( bz.SettingGame.SOIL_SIZE_Y ); ++y )
                {
                    const soilType :bz.SoilType = bz.Stage.getRandomSoil();

                    soilCol.push(
                        new bz.Soil
                        (
                            soilType,
                            this,
                            new bz.Model(
                                [
                                    bz.MeshFactory.createBox(
                                        this.scene,
                                        this.ambientColor,
                                        bz.Texture.WALL_SOIL,
                                        new BABYLON.Vector3(
                                            x * bz.SettingGame.TILE_SIZE_X,
                                            ( ( - 2.0 - y ) * bz.SettingGame.TILE_SIZE_Y ),
                                            0.0
                                        ),
                                        new BABYLON.Vector3(
                                            bz.SettingGame.TILE_SIZE_X,
                                            bz.SettingGame.TILE_SIZE_Y,
                                            bz.SettingGame.TILE_SIZE_Z
                                        )
                                    ),
                                ]
                            )
                        )
                    );
                }

                soil.push( soilCol );
            }

            return soil;
        }
/*
        new bz.Wall
        (
            this,
            bz.MeshFactory.createBoxLine(
                this.scene,
                this.ambientColor,
                new BABYLON.Vector3(
                    0.0,
                    ( ( -bz.SettingGame.SOIL_SIZE_Y - 1.0 ) * bz.SettingGame.TILE_SIZE_Y ),
                    0.0
                ),
                bz.Texture.WALL_SOIL,
                ( bz.SettingGame.LEVEL_SIZE_X - 1 ),
                bz.SettingGame.SOIL_SIZE_Y,
                1
            )
        )
*/
        /** ************************************************************************************************************
        *   Creates and returns the soil bg wall blocks for this stage.
        *
        *   @return All soil bg walls of this stage.
        ***************************************************************************************************************/
        private createSoilBg() : bz.Wall[][]
        {
            const soilBg :bz.Wall[][] = [];

            for ( let x :number = 0; x < ( bz.SettingGame.LEVEL_SIZE_X - 1 ); ++x )
            {
                const soilBgCol :bz.Wall[] = [];

                for ( let y :number = 0; y < ( bz.SettingGame.SOIL_SIZE_Y ); ++y )
                {
                    soilBgCol.push(
                        new bz.Wall
                        (
                            this,
                            new bz.Model(
                                [
                                    bz.MeshFactory.createBox(
                                        this.scene,
                                        this.ambientColor,
                                        bz.Texture.SOIL_EMPTY,
                                        new BABYLON.Vector3(
                                            x * bz.SettingGame.TILE_SIZE_X,
                                            ( ( - 2.0 - y ) * bz.SettingGame.TILE_SIZE_Y ),
                                            bz.SettingGame.TILE_SIZE_Z
                                        ),
                                        new BABYLON.Vector3(
                                            bz.SettingGame.TILE_SIZE_X,
                                            bz.SettingGame.TILE_SIZE_Y,
                                            bz.MeshFactory.FACE_DEPTH
                                        )
                                    ),
                                ]
                            )
                        )
                    );
                }

                soilBg.push( soilBgCol );
            }

            return soilBg;
        }

        /** ************************************************************************************************************
        *   Creates and returns all walls this stage consists of.
        *
        *   @return All walls of this stage.
        ***************************************************************************************************************/
        private createWalls() : bz.Wall[]
        {
            const walls :bz.Wall[] = [];

            // ground blocks
            walls.push(
                new bz.Wall
                (
                    this,
                    bz.MeshFactory.createBoxLine(
                        this.scene,
                        this.ambientColor,
                        new BABYLON.Vector3( 0.0, -bz.SettingGame.TILE_SIZE_Y, 0.0 ),
                        bz.Texture.WALL_GROUND,
                        ( bz.SettingGame.LEVEL_SIZE_X - 1 ),
                        1,
                        1
                    )
                )
            );

            // ground pane
            walls.push(
                new bz.Wall
                (
                    this,
                    new bz.Model
                    (
                        [
                            bz.MeshFactory.createBox
                            (
                                this.scene,
                                this.ambientColor,
                                bz.Texture.WALL_GRASS,
                                new BABYLON.Vector3(
                                    0.0,
                                    0.0,
                                    0.0
                                ),
                                new BABYLON.Vector3(
                                    bz.SettingGame.LEVEL_SIZE_X * bz.SettingGame.TILE_SIZE_X,
                                    bz.MeshFactory.FACE_DEPTH,
                                    25.0
                                )
                            ),
                        ]
                    )
                )
            );

            // house bank
            walls.push(
                new bz.Wall
                (
                    this,
                    new bz.Model
                    (
                        [
                            // static ground
                            bz.MeshFactory.createBox
                            (
                                this.scene,
                                this.ambientColor,
                                bz.Texture.HOUSE_BANK,
                                new BABYLON.Vector3(
                                    ( 5 * bz.SettingGame.TILE_SIZE_X ),
                                    0.0,
                                    ( 1.5 * bz.SettingGame.TILE_SIZE_Z )
                                ),
                                new BABYLON.Vector3(
                                    4 * bz.SettingGame.TILE_SIZE_X,
                                    2 * bz.SettingGame.TILE_SIZE_Y,
                                    bz.MeshFactory.FACE_DEPTH
                                )
                            ),
                        ]
                    )
                )
            );

            // house hospital
            walls.push(
                new bz.Wall
                (
                    this,
                    new bz.Model
                    (
                        [
                            bz.MeshFactory.createBox
                            (
                                this.scene,
                                this.ambientColor,
                                bz.Texture.HOUSE_HOSPITAL,
                                new BABYLON.Vector3(
                                    ( 12 * bz.SettingGame.TILE_SIZE_X ),
                                    0.0,
                                    ( 1.5 * bz.SettingGame.TILE_SIZE_Z )
                                ),
                                new BABYLON.Vector3(
                                    5 * bz.SettingGame.TILE_SIZE_X,
                                    2 * bz.SettingGame.TILE_SIZE_Y,
                                    bz.MeshFactory.FACE_DEPTH
                                )
                            ),
                        ]
                    )
                )
            );

            // house saloon
            walls.push(
                new bz.Wall
                (
                    this,
                    new bz.Model
                    (
                        [
                            bz.MeshFactory.createBox
                            (
                                this.scene,
                                this.ambientColor,
                                bz.Texture.HOUSE_SALOON,
                                new BABYLON.Vector3(
                                    ( 20 * bz.SettingGame.TILE_SIZE_X ),
                                    0.0,
                                    ( 1.5 * bz.SettingGame.TILE_SIZE_Z )
                                ),
                                new BABYLON.Vector3(
                                    5 * bz.SettingGame.TILE_SIZE_X,
                                    2 * bz.SettingGame.TILE_SIZE_Y,
                                    bz.MeshFactory.FACE_DEPTH
                                )
                            ),
                        ]
                    )
                )
            );

            // house store
            walls.push(
                new bz.Wall
                (
                    this,
                    new bz.Model
                    (
                        [
                            bz.MeshFactory.createBox
                            (
                                this.scene,
                                this.ambientColor,
                                bz.Texture.HOUSE_STORE,
                                new BABYLON.Vector3(
                                    ( 28 * bz.SettingGame.TILE_SIZE_X ),
                                    0.0,
                                    ( 1.5 * bz.SettingGame.TILE_SIZE_Z )
                                ),
                                new BABYLON.Vector3(
                                    4 * bz.SettingGame.TILE_SIZE_X,
                                    2 * bz.SettingGame.TILE_SIZE_Y,
                                    bz.MeshFactory.FACE_DEPTH
                                )
                            ),
                        ]
                    )
                )
            );

            // deco table
            walls.push(
                new bz.Wall
                (
                    this,
                    new bz.Model
                    (
                        [
                            bz.MeshFactory.createBox
                            (
                                this.scene,
                                this.ambientColor,
                                bz.Texture.DECO_TABLE,
                                new BABYLON.Vector3(
                                    ( 34 * bz.SettingGame.TILE_SIZE_X ),
                                    0.0,
                                    ( 1.5 * bz.SettingGame.TILE_SIZE_Z )
                                ),
                                new BABYLON.Vector3(
                                    bz.SettingGame.TILE_SIZE_X,
                                    bz.SettingGame.TILE_SIZE_Y,
                                    bz.MeshFactory.FACE_DEPTH
                                )
                            ),
                        ]
                    )
                )
            );

            // deco cactus
            walls.push(
                new bz.Wall
                (
                    this,
                    new bz.Model
                    (
                        [
                            bz.MeshFactory.createBox
                            (
                                this.scene,
                                this.ambientColor,
                                bz.Texture.DECO_CACTUS,
                                new BABYLON.Vector3(
                                    ( 2 * bz.SettingGame.TILE_SIZE_X ),
                                    0.0,
                                    ( 1.5 * bz.SettingGame.TILE_SIZE_Z )
                                ),
                                new BABYLON.Vector3(
                                    bz.SettingGame.TILE_SIZE_X,
                                    bz.SettingGame.TILE_SIZE_Y,
                                    bz.MeshFactory.FACE_DEPTH
                                )
                            ),
                        ]
                    )
                )
            );

            // deco bird
            walls.push(
                new bz.Wall
                (
                    this,
                    new bz.Model
                    (
                        [
                            bz.MeshFactory.createBox
                            (
                                this.scene,
                                this.ambientColor,
                                bz.Texture.DECO_BIRD,
                                new BABYLON.Vector3(
                                    ( 4 * bz.SettingGame.TILE_SIZE_X ),
                                    ( 2 * bz.SettingGame.TILE_SIZE_Y ),
                                    ( 1.5 * bz.SettingGame.TILE_SIZE_Z )
                                ),
                                new BABYLON.Vector3(
                                    bz.SettingGame.TILE_SIZE_X,
                                    bz.SettingGame.TILE_SIZE_Y,
                                    bz.MeshFactory.FACE_DEPTH
                                )
                            ),
                        ]
                    )
                )
            );

            // deco bird
            walls.push(
                new bz.Wall
                (
                    this,
                    new bz.Model
                    (
                        [
                            bz.MeshFactory.createBox
                            (
                                this.scene,
                                this.ambientColor,
                                bz.Texture.DECO_BIRD,
                                new BABYLON.Vector3(
                                    ( 26 * bz.SettingGame.TILE_SIZE_X ),
                                    bz.SettingGame.TILE_SIZE_Y,
                                    ( 1.5  * bz.SettingGame.TILE_SIZE_Z )
                                ),
                                new BABYLON.Vector3(
                                    bz.SettingGame.TILE_SIZE_X,
                                    bz.SettingGame.TILE_SIZE_Y,
                                    bz.MeshFactory.FACE_DEPTH
                                )
                            ),
                        ]
                    )
                )
            );

            // elevator
            this.elevator = new bz.Wall
            (
                this,
                new bz.Model
                (
                    [
                        bz.MeshFactory.createBox
                        (
                            this.scene,
                            this.ambientColor,
                            bz.Texture.WALL_ELEVATOR,
                            new BABYLON.Vector3(
                                (
                                    ( bz.SettingGame.LEVEL_SIZE_X - 1 )
                                    * bz.SettingGame.TILE_SIZE_X
                                ),
                                -bz.SettingGame.TILE_SIZE_Y,
                                ( 1.5  * bz.SettingGame.TILE_SIZE_Z )
                            ),
                            new BABYLON.Vector3(
                                bz.SettingGame.TILE_SIZE_X,
                                ( 3 * bz.SettingGame.TILE_SIZE_Y ),
                                bz.MeshFactory.FACE_DEPTH
                            )
                        ),
                    ]
                )
            );
            walls.push( this.elevator );

            return walls;
        }

        /** ************************************************************************************************************
        *   Sets up the skybox.
        *
        *   @return The created skybox for this stage.
        ***************************************************************************************************************/
        private createSkybox() : BABYLON.Mesh
        {
            return bz.MeshFactory.createSkyBoxCube( this.scene.getNativeScene(), 'blueSky', 1.0 );
        }

        /** ************************************************************************************************************
        *   Being invoked when the stage setup is complete.
        ***************************************************************************************************************/
        private onInitComplete() : void
        {
            // do nothing ..
        }

        /** ************************************************************************************************************
        *   Creates the GUI for this stage.
        ***************************************************************************************************************/
        private createGUI() : bz.GUI
        {
            const gui:bz.GUIGame = new bz.GUIGame( this.scene.getNativeScene() );
            gui.init();

            return gui;
        }

        /** ************************************************************************************************************
        *   Sets up the coordinal axis lines. X Y and Z axes are aligned by the LEFT HAND RULE.
        *
        *   @return A collection of all meshes that build the coordinal axis lines.
        ***************************************************************************************************************/
        private createCoordinalAxis() : void
        {
            this.debugMeshes.push
            (
                // axis x
                bz.MeshFactory.createLine
                (
                    this.scene.getNativeScene(),
                    new BABYLON.Vector3( 0.0,  0.0, 0.0 ),
                    new BABYLON.Vector3( bz.SettingDebug.DEBUG_COORDINATE_AXIS_LENGTH, 0.0, 0.0 ),
                    new BABYLON.Vector3( 0.0, 0.0, 0.0 ),
                    bz.SettingColor.COLOR_RGBA_RED_OPAQUE
                ),

                // axis y
                bz.MeshFactory.createLine
                (
                    this.scene.getNativeScene(),
                    new BABYLON.Vector3( 0.0, 0.0,  0.0 ),
                    new BABYLON.Vector3( 0.0, bz.SettingDebug.DEBUG_COORDINATE_AXIS_LENGTH, 0.0 ),
                    new BABYLON.Vector3( 0.0, 0.0, 0.0 ),
                    bz.SettingColor.COLOR_RGBA_GREEN_OPAQUE
                ),

                // axis z
                bz.MeshFactory.createLine
                (
                    this.scene.getNativeScene(),
                    new BABYLON.Vector3( 0.0, 0.0, 0.0  ),
                    new BABYLON.Vector3( 0.0, 0.0, bz.SettingDebug.DEBUG_COORDINATE_AXIS_LENGTH ),
                    new BABYLON.Vector3( 0.0, 0.0, 0.0 ),
                    bz.SettingColor.COLOR_RGBA_BLUE_OPAQUE
                )
            );
        }

        /** ************************************************************************************************************
        *   Alters the pause state for the GUI.
        ***************************************************************************************************************/
        private setGuiPause() : void
        {
            this.gui.setPauseGuiVisibility( this.pause );
        }

        /** ************************************************************************************************************
        *   Handles level specific keys.
        ***************************************************************************************************************/
        private static handleLevelKeys() : void
        {
            // const keySystem :bz.KeySystem = bz.Main.game.getKeySystem();
/*
            if ( keySystem.isPressed( bz.KeyCodes.KEY_ENTER ) )
            {
                keySystem.setNeedsRelease( bz.KeyCodes.KEY_ENTER );
            }
*/
        }

        /** ************************************************************************************************************
        *   Pick a random soil type for one block of the game.
        ***************************************************************************************************************/
        private static getRandomSoil() : bz.SoilType
        {
            const randomCent :number = bz.MathUtil.getRandomInt( 0, 100 );

            switch ( true )
            {
                case ( randomCent < 4 ):
                    return bz.SoilType.PLATINUM;

                case ( randomCent < 10 ):
                    return bz.SoilType.GOLD;

                case ( randomCent < 15 ):
                    return bz.SoilType.SILVER;

                case ( randomCent < 30 ):
                    return bz.SoilType.SANDSTONE;

                case ( randomCent < 33 ):
                    return bz.SoilType.WATER;

                case ( randomCent < 40 ):
                    return bz.SoilType.GRANITE;

                default:
                    return bz.SoilType.NOTHING;
            }
        }
    }
