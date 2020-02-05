
    import * as bz from '../../index';

    /** ****************************************************************************************************************
    *   Represents a spaceship being controlled by the user.
    *******************************************************************************************************************/
    export class Player extends bz.GameObject
    {
        /** The referenced body mesh. */
        private             readonly    body                        :BABYLON.AbstractMesh               = null;

        /** Current player element position. */
        private                         pos                         :BABYLON.Vector3                    = null;

        /** Flags if the player currently wants to zoom. */
        private                         zoom                        :boolean                            = false;
        /** The current field of view of the player. Changes on zooming. */
        private                         fieldOfView                 :number                             = 0.0;

        /** Flags if the player movement is currently blocked. */
        private                         moveBlockerTicks            :number                             = 0;

        /** Number of animation ticks to perform. */
        private                         animationTicks              :number                             = 0;
        /** Current Animation Direction. */
        private                         animationDir                :bz.Direction                       = 0;

        /** Flags if the elevator shall stick to the player. */
        private                         stickElevatorToPlayer       :boolean                            = false;

        /** ************************************************************************************************************
        *   Creates a new player instance.
        *
        *   @param stage        The stage this player belongs to.
        *   @param scene        The scene reference.
        *   @param pos          The initial position.
        *   @param ambientColor The ambient color of all mesh faces.
        ***************************************************************************************************************/
        public constructor
        (
            stage        :bz.Stage,
            scene        :bz.Scene,
            pos          :BABYLON.Vector3,
            ambientColor :BABYLON.Color3
        )
        {
            super
            (
                stage,
                new bz.Model
                (
                    [
                        // box 1
                        bz.MeshFactory.createBox
                        (
                            scene,
                            ambientColor,
                            bz.Texture.MINER_STAND_RIGHT,
                            new BABYLON.Vector3(
                                pos.x * bz.SettingGame.TILE_SIZE_X,
                                pos.y * bz.SettingGame.TILE_SIZE_Y,
                                ( pos.z + 0.5 ) * bz.SettingGame.TILE_SIZE_Z
                            ),
                            new BABYLON.Vector3(
                                bz.SettingGame.TILE_SIZE_X,
                                bz.SettingGame.TILE_SIZE_Y,
                                bz.MeshFactory.FACE_DEPTH
                            )
                        ),
                    ]
                )
            );

            // assign initial position
            this.pos = pos;

            // reference the body and all limbs
            this.body = this.model.getMesh( 0 );

            // set alpha to opaque
            this.body.material.alpha = 1.0;

            // set initial height
            this.fieldOfView = bz.SettingEngine.DEFAULT_FOV;
        }

        /** ************************************************************************************************************
        *   Renders one tick of the player's game loop.
        ***************************************************************************************************************/
        public render() : void
        {
            // lower move blocker and animation ticks
            if ( this.moveBlockerTicks > 0 )
            {
                --this.moveBlockerTicks;
            }

            // evtl. nach handleKeys ?
            if ( this.animationTicks   > 0 )
            {
                --this.animationTicks;

                this.renderPlayerAnimation();
            }

            // handle keys
            this.handlePlayerKeys();

            // check zoom
            this.checkFieldOfViewChange();
        }

        /** ************************************************************************************************************
        *   Returns the player's target mesh for the first person camera.
        *
        *   @return The player's head mesh.
        *           This is the right mesh to set the first person camera into.
        ***************************************************************************************************************/
        public getFirstPersonCameraTargetMesh() : BABYLON.AbstractMesh
        {
            return this.body;
        }

        /** ************************************************************************************************************
        *   Returns the player's target mesh for the third person camera.
        *
        *   @return The player's body mesh.
        *           This is the right mesh to set as a target for the third person camera.
        ***************************************************************************************************************/
        public getThirdPersonCameraTargetMesh() : BABYLON.AbstractMesh
        {
            return this.body;
        }

        /** ************************************************************************************************************
        *   Returns the player's current position.
        *
        *   @return The player's position.
        ***************************************************************************************************************/
        public getPosition() : BABYLON.Vector3
        {
            return this.pos;
        }

        /** ************************************************************************************************************
        *   Determines the target position for the player to move in the specified direction.
        *
        *   @param pressedMoveDirection The direction to determine movement.
        *
        *   @return The player's new position or <code>null</code> if it is no valid position.
        ***************************************************************************************************************/
        public determineTargetPosition( pressedMoveDirection:bz.Direction ) : BABYLON.Vector3
        {
            // alter position by performing movement
            switch ( pressedMoveDirection )
            {
                case bz.Direction.DOWN:
                {
                    // player is on top and not over the elevator
                    if
                    (
                        this.pos.x < ( bz.SettingGame.LEVEL_SIZE_X - 1 )
                        && this.pos.y === 0
                    ) {
                        return null;
                    }

                    if
                    (
                        // this.pos.x === ( bz.SettingLevel.LEVEL_SIZE_X - 1 )
                        this.pos.y > ( -bz.SettingGame.SOIL_SIZE_Y - 1 )
                    ) {
                        const targetPosition :BABYLON.Vector3 = this.pos.clone();
                        targetPosition.y = this.pos.y - 1.0;
                        return targetPosition;
                    }
                    break;
                }

                case bz.Direction.UP:
                {
                    // not directly below the ground
                    if
                    (
                        this.pos.x < ( bz.SettingGame.LEVEL_SIZE_X - 1 )
                        && this.pos.y === -2.0
                    ) {
                        return null;
                    }

                    // not on the top row
                    if
                    (
                        this.pos.y < 0.0
                    ) {
                        const targetPosition :BABYLON.Vector3 = this.pos.clone();
                        targetPosition.y = this.pos.y + 1.0;
                        return targetPosition;
                    }
                    break;
                }

                case bz.Direction.LEFT:
                {
                    bz.MeshManipulation.assignNewTexture( this.body, bz.Texture.MINER_STAND_LEFT );

                    // not in ground line
                    if
                    (
                        this.pos.y === -1
                    )
                    {
                        return null;
                    }

                    // not on left border
                    if
                    (
                        this.pos.x > 0.0
                    )
                    {
                        const targetPosition :BABYLON.Vector3 = this.pos.clone();
                        targetPosition.x = this.pos.x - 1.0;
                        return targetPosition;
                    }
                    break;
                }

                case bz.Direction.RIGHT:
                {
                    bz.MeshManipulation.assignNewTexture( this.body, bz.Texture.MINER_STAND_RIGHT );

                    if
                    (
                        (
                            // player must face the elevator on entering the elevator lane
                            this.pos.x === ( bz.SettingGame.LEVEL_SIZE_X - 2 )
                            && this.pos.y === this.stage.getElevatorPosition().y
                        )

                        // always move player if far away from the elevator column
                        || ( this.pos.x < ( bz.SettingGame.LEVEL_SIZE_X - 2 ) )
                    )
                    {
                        const targetPosition :BABYLON.Vector3 = this.pos.clone();
                        targetPosition.x = this.pos.x + 1.0;
                        return targetPosition;
                    }
                    break;
                }
            }

            return null;
        }

        /** ************************************************************************************************************
        *   Handles all keys for the player.
        ***************************************************************************************************************/
        private handlePlayerKeys() : void
        {
            // check if movement direction is pressed if movement is not currently blocked
            if ( this.moveBlockerTicks === 0 )
            {
                // check pressed movement and perform
                const pressedDir :bz.Direction = Player.getPressedMoveDirection();
                if ( pressedDir !== null )
                {
                    // get target position
                    const targetPosition :BABYLON.Vector3 = this.determineTargetPosition( pressedDir );

                    // move to target position if position changed
                    if ( targetPosition !== null )
                    {
                        this.performMovement( targetPosition, pressedDir );
                    }
                }
            }

            // zooming is always possible
            if ( bz.Main.game.getKeySystem().isPressed( bz.KeyCodes.KEY_ENTER ) )
            {
                bz.Main.game.getKeySystem().setNeedsRelease( bz.KeyCodes.KEY_ENTER );

                // toggle zoom
                this.zoom = !this.zoom;
            }
        }

        /** ************************************************************************************************************
        *   Checks if the player's field of view changes.
        ***************************************************************************************************************/
        private checkFieldOfViewChange() : void
        {
            const cameraSystem:bz.CameraSystem = this.stage.getCameraSystem();

            if ( this.zoom )
            {
                if ( this.fieldOfView < bz.SettingEngine.MAX_ZOOM )
                {
                    this.fieldOfView += bz.SettingGame.CAMERA_ZOOM_SPEED;

                    if ( this.fieldOfView > bz.SettingEngine.MAX_ZOOM )
                    {
                        this.fieldOfView = bz.SettingEngine.MAX_ZOOM;
                    }

                    cameraSystem.setFirstPersonCameraFieldOfView( this.fieldOfView );
                }
            }
            else
            {
                if ( this.fieldOfView > bz.SettingEngine.DEFAULT_FOV )
                {
                    this.fieldOfView -= bz.SettingGame.CAMERA_ZOOM_SPEED;

                    if ( this.fieldOfView < bz.SettingEngine.DEFAULT_FOV )
                    {
                        this.fieldOfView = bz.SettingEngine.DEFAULT_FOV;
                    }

                    cameraSystem.setFirstPersonCameraFieldOfView( this.fieldOfView );
                }
            }
        }

        /** ************************************************************************************************************
        *   Performs the position change for the player with all consequences.
        ***************************************************************************************************************/
        private performMovement( targetPosition :BABYLON.Vector3, moveDir:bz.Direction ) : void
        {
            // delay next movement
            this.moveBlockerTicks = bz.SettingEngine.FRAMES_MINER_WALK;

            // pick target soil
            const currentSoil :bz.Soil = this.stage.getSoilOnPlayerPosition( this.pos       );
            const targetSoil  :bz.Soil = this.stage.getSoilOnPlayerPosition( targetPosition );

            // check if target soil is yet closed
            if (
                targetSoil !== null
                && targetSoil.isClosed()
            ) {
                // open soil and hide wall
                targetSoil.openSoil();

                // increase next movement delay though to opening soil
                this.moveBlockerTicks = bz.SettingGame.DELAY_AFTER_SOIL_OPEN;
            }

            // deny performing movement if targetSoil is available but not enterable
            if (
                targetSoil !== null
                && !targetSoil.isEnterable()
            ) {
                return;
            }

            // get existent soil and clear it
            if ( currentSoil !== null )
            {
                currentSoil.clearSoil();
            }

            // move player to target position
            this.applyTargetPosition( targetPosition, moveDir );

            // check additional actions after movement

            // show hint for sorrounding fields
            this.stage.checkTriggeringSoilHints( this.pos );

            // stick elevator to player if required
            if (
                (
                    moveDir    === bz.Direction.UP
                    || moveDir === bz.Direction.DOWN
                )
                && this.pos.x === ( bz.SettingGame.LEVEL_SIZE_X - 1 )
            ) {
                this.stickElevatorToPlayer = true;

                this.stage.setElevatorPosition( this.pos );
            }
            else
            {
                this.stickElevatorToPlayer = false;
            }
        }

        /** ************************************************************************************************************
        *   Applies the new target position to the player and starts player animation.
        *
        *   @param targetPosition Target position to apply player position to.
        *   @param moveDir        The direction being used for reaching this specified target position.
        ***************************************************************************************************************/
        private applyTargetPosition( targetPosition :BABYLON.Vector3, moveDir :bz.Direction ) : void
        {
            // move the player into the target wall
            this.pos = targetPosition;

            // animnate block to new position
            // this.animatePlayerMesh();

            this.animationTicks = bz.SettingEngine.FRAMES_MINER_WALK;
            this.animationDir   = moveDir;

            // animate stationary camera
            this.stage.updateCameraPosition();
        }

        /** ************************************************************************************************************
        *   Handles one render frame for the player.
        ***************************************************************************************************************/
        private renderPlayerAnimation() : void
        {
            let currentPlayerMeshPosition :BABYLON.Vector3 = null;

            switch ( this.animationDir )
            {
                case bz.Direction.RIGHT:
                {
                    currentPlayerMeshPosition = new BABYLON.Vector3(
                        this.pos.x * bz.SettingGame.TILE_SIZE_X
                        - ( this.animationTicks * bz.SettingGame.TILE_SIZE_X / bz.SettingEngine.FRAMES_MINER_WALK ),
                        this.pos.y * bz.SettingGame.TILE_SIZE_Y,
                        ( this.pos.z + 0.5 ) * bz.SettingGame.TILE_SIZE_Z
                    );
                    break;
                }

                case bz.Direction.DOWN:
                {
                    currentPlayerMeshPosition = new BABYLON.Vector3(
                        this.pos.x * bz.SettingGame.TILE_SIZE_X,
                        this.pos.y * bz.SettingGame.TILE_SIZE_Y
                        + ( this.animationTicks * bz.SettingGame.TILE_SIZE_Y / bz.SettingEngine.FRAMES_MINER_WALK ),
                        ( this.pos.z + 0.5 ) * bz.SettingGame.TILE_SIZE_Z
                    );
                    break;
                }

                case bz.Direction.LEFT:
                {
                    currentPlayerMeshPosition = new BABYLON.Vector3(
                        this.pos.x * bz.SettingGame.TILE_SIZE_X
                        + ( this.animationTicks * bz.SettingGame.TILE_SIZE_X / bz.SettingEngine.FRAMES_MINER_WALK ),
                        this.pos.y * bz.SettingGame.TILE_SIZE_Y,
                        ( this.pos.z + 0.5 ) * bz.SettingGame.TILE_SIZE_Z
                    );
                    break;
                }

                case bz.Direction.UP:
                {
                    currentPlayerMeshPosition = new BABYLON.Vector3(
                        this.pos.x * bz.SettingGame.TILE_SIZE_X,
                        this.pos.y * bz.SettingGame.TILE_SIZE_Y
                        - ( this.animationTicks * bz.SettingGame.TILE_SIZE_Y / bz.SettingEngine.FRAMES_MINER_WALK ),
                        ( this.pos.z + 0.5 ) * bz.SettingGame.TILE_SIZE_Z
                    );
                    break;
                }
            }

            if ( currentPlayerMeshPosition !== null )
            {
                bz.MeshManipulation.setPosition(
                    this.model.getMesh( 0 ),
                    currentPlayerMeshPosition
                );

                if ( this.stickElevatorToPlayer )
                {
                    this.stage.setElevatorMeshPosition( currentPlayerMeshPosition );
                }
            }
        }

        /** ************************************************************************************************************
        *   Delivers the currently pressed move direction.
        *
        *   @return The player's position.
        ***************************************************************************************************************/
        private static getPressedMoveDirection() : bz.Direction
        {
            const keySystem:bz.KeySystem = bz.Main.game.getKeySystem();

            // down
            if
            (
                keySystem.isPressed( bz.KeyCodes.KEY_S )
                || keySystem.isPressed( bz.KeyCodes.KEY_DOWN )
            )
            {
                return bz.Direction.DOWN;
            }

            // up
            if
            (
                keySystem.isPressed( bz.KeyCodes.KEY_W )
                || keySystem.isPressed( bz.KeyCodes.KEY_UP )
            )
            {
                return bz.Direction.UP;
            }

            // left
            if
            (
                keySystem.isPressed( bz.KeyCodes.KEY_A )
                || keySystem.isPressed( bz.KeyCodes.KEY_LEFT )
            )
            {
                return bz.Direction.LEFT;
            }

            // right
            if
            (
                keySystem.isPressed( bz.KeyCodes.KEY_D )
                || keySystem.isPressed( bz.KeyCodes.KEY_RIGHT )
            )
            {
                return bz.Direction.RIGHT;
            }

            return null;
        }
    }
