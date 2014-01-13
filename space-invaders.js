var LEFT_KEY = 37;
var RIGHT_KEY = 39;
var SPACE_KEY = 32;
var ESC_KEY = 27;

var SpaceInvadersData = function() {
  var data = {
    loading: true,
    width: 1920,
    height: 1440,
    num_columns: 11,
    column_width: 150,
    column_padding: 11,
    row_height: 100,
    row_padding: 16,
    side_padding: 10,
    fps: 60,
    mups: 30
  };

  data.ms_per_frame = (1 / data.fps) * 1000;
  data.ms_per_model_update = (1 / data.mups) * 1000;

  data.texture_map = {
    alien1_1: {name: "res/images/alien1-1.png", loaded: false, texture: null, width: 128, height: 64},
    alien1_2: {name: "res/images/alien1-2.png", loaded: false, texture: null, width: 128, height: 64},
    alien2_1: {name: "res/images/alien2-1.png", loaded: false, texture: null, width: 128, height: 64},
    alien2_2: {name: "res/images/alien2-2.png", loaded: false, texture: null, width: 128, height: 64},
    alien3_1: {name: "res/images/alien3-1.png", loaded: false, texture: null, width: 128, height: 64},
    alien3_2: {name: "res/images/alien3-2.png", loaded: false, texture: null, width: 128, height: 64},
    alien_destroyed: {name: "res/images/alien-destroyed.png", loaded: false, texture: null, width: 128, height: 64},
    cannon: {name: "res/images/cannon.png", loaded: false, texture: null, width: 128, height: 64},
    cannon_destroyed: {name: "res/images/cannon-destroyed.png", loaded: false, texture: null, width: 128, height: 64},
    building: {name: "res/images/building.png", loaded: false, texture: null, width: 256, height: 128}
  };

  data.alien_matrix = [
    [1,1,1,1,1,1,1,1,1,1,1],
    [2,2,2,2,2,2,2,2,2,2,2],
    [2,2,2,2,2,2,2,2,2,2,2],
    [3,3,3,3,3,3,3,3,3,3,3],
    [3,3,3,3,3,3,3,3,3,3,3]
  ];

  data.cannon = {
    start_x: (data.width - data.texture_map.cannon.width) / 2,
    start_y: data.height - 10 - data.texture_map.cannon.height,
    speed_ms: 0.5,
    width: data.texture_map.cannon.width,
    height: data.texture_map.cannon.height,
    alive: data.texture_map.cannon,
    dead: data.texture_map.cannon_destroyed
  };

  data.aliens = {
    animation_length_ms: 900,
    movement_speed_ms: 0.01,
    start_y: 10,
    start_x: data.width - data.alien_matrix[0].length * data.column_width,

    1: {
      animation: [data.texture_map.alien1_1,
                  data.texture_map.alien1_2]
    },
    2: {
      animation: [data.texture_map.alien2_1,
                  data.texture_map.alien2_2]
    },
    3: {
      animation: [data.texture_map.alien3_1,
                  data.texture_map.alien3_2]
    }
  };

  data.loadTextures = function() {
    $.each(data.texture_map, function(key, value) {
      var image = new Image();
      image.onload = function() {
        value.texture = image;

        data.checkIsFinishedLoading();
      }
      image.src = value.name;
    });
  };

  data.checkIsFinishedLoading = function() {
    $.each(data.texture_map, function(key, value) {
      if (value.texture === null) {
        data.loading = true;
        return false;
      }
    });

    data.loading = false;
    return true;
  };

  return data;
};

SpaceInvadersRenderer = function(canvas, data) {
  var renderer = {
    context: canvas.getContext('2d'),
    scaling_factor: Math.min(canvas.width / data.width, canvas.height / data.height),
    ms_since_animation_change: 0,
    alien_animation_flipped: false
  };

  renderer.render = function(model) {
    function renderCannon(cannon) {
      var image = !cannon.destroyed ? data.cannon.alive : data.cannon.dead;
      renderer.context.drawImage(image.texture, 
                                 cannon.x * renderer.scaling_factor,
                                 cannon.y * renderer.scaling_factor,
                                 data.cannon.width * renderer.scaling_factor, 
                                 data.cannon.height * renderer.scaling_factor);
    };

    function renderBuildings(buildings) {
      function renderBuilding(building, x, y) {

      };
    };

    function renderAliens(aliens) {
      function renderAlien(type, x, y) {
        var image = renderer.alien_animation_flipped ? data.aliens[type].animation[1] : data.aliens[type].animation[0];
        renderer.context.drawImage(image.texture,
                                   renderer.scaling_factor * x, 
                                   renderer.scaling_factor * y,
                                   renderer.scaling_factor * image.width,
                                   renderer.scaling_factor * image.height);
      };

      $.each(aliens.liveness, function(row_index, row) {
        $.each(row, function(column_index, alien) {
          if (alien) {
            renderAlien(data.alien_matrix[row_index][column_index], 
                        column_index * data.column_width + data.side_padding + aliens.x,
                        row_index * data.row_height + data.side_padding + aliens.y + data.row_padding);
          }
        });
      });
    };

    renderer.ms_since_animation_change += data.ms_per_frame;
    if (renderer.ms_since_animation_change > data.aliens.animation_length_ms) {
      renderer.ms_since_animation_change = 0;
      renderer.alien_animation_flipped = !renderer.alien_animation_flipped;
    }

    renderer.context.fillStyle = "#666666";
    renderer.context.fillRect(0, 0, canvas.width, canvas.height);
    renderer.context.fillStyle = "#000000";
    renderer.context.fillRect(0, 0, data.width * renderer.scaling_factor, data.height * renderer.scaling_factor);

    renderCannon(model.cannon);
    renderAliens(model.aliens);

    if (model.keys[ESC_KEY]) {
      clearInterval(renderer.timer);
    }
  };

  return renderer;
};

var SpaceInvadersModel = function(data) {
  model = {
    score: 0,
    lives: 3,
    keys: {
      LEFT_KEY: false,
      RIGHT_KEY: false,
      SPACE_KEY: false,
      ESC_KEY: false
    },
  };

  model.cannon = {
    x: data.cannon.start_x,
    y: data.cannon.start_y,
    destroyed: false
  };

  model.aliens = {
    direction: 1,
    x: data.aliens.start_x,
    y: data.aliens.start_y,
    liveness: [
      [true, true, true, true, true, true, true, true, true, true, true],
      [true, true, true, true, true, true, true, true, true, true, true],
      [true, true, true, true, true, true, true, true, true, true, true],
      [true, true, true, true, true, true, true, true, true, true, true],
      [true, true, true, true, true, true, true, true, true, true, true]
    ]
  };

  model.update = function() {
    /*
     * Move the cannon if the keys are being held down. Capped to the edge of
     * the screen.
     */
    if (model.keys[LEFT_KEY]) {
      model.cannon.x -= data.cannon.speed_ms * data.ms_per_model_update;
    } 

    if (model.keys[RIGHT_KEY]) {
      model.cannon.x += data.cannon.speed_ms * data.ms_per_model_update;
    }
    model.cannon.x = Math.min(data.width - data.side_padding - data.cannon.width, Math.max(data.side_padding, model.cannon.x));

    /*
     * If the escape key is currently held down then kill the timer for the
     * model update so that this function doesn't get called again.
     */
    if (model.keys[ESC_KEY]) {
      clearInterval(model.timer);
    }

    /*
     * Move the aliens, reversing direction and dropping a row if they hit 
     * the edge.
     */
    model.aliens.x += data.aliens.movement_speed_ms * data.ms_per_model_update * model.aliens.direction;
    if (model.aliens.x + data.alien_matrix[0].length * data.column_width > data.width - data.side_padding || 
        model.aliens.x <= data.side_padding) {
      model.aliens.direction *= -1;
      model.aliens.y += data.row_height;
    }
    model.aliens.x = Math.min(data.width - data.side_padding - data.alien_matrix[0].length * data.column_width, 
                              Math.max(data.side_padding, model.aliens.x));
  };

  return model;
};