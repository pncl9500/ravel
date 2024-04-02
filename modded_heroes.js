class EnemyEffect {
  constructor(duration, source, priority){
    this.duration = duration;
    this.life = duration;
    this.noDuration = duration === -1;
    this.source = source;
    this.priority = priority;
    this.toRemove = false;
  }
  apply(time, target){
    this.life -= time;
    if (this.life < 0){
      this.toRemove = true;
      return;
    }
    this.doEffect(time, target, this.source);
  }
}

class JudgementEffect extends EnemyEffect{
  constructor(duration, source){
    super(duration, source, 1000);
    console.log(duration);
  }
  doEffect(time, target, source){
    target.radiusMultiplier = Math.min((source.radius / target.fixedRadius), 1);
    target.speedMultiplier = Math.min(source.speed / target.speed, 1);
    //uncomment for superhot minerva
    //target.speedMultiplier = Math.min((Math.sqrt(source.vel.x * source.vel.x + source.vel.y * source.vel.y)) / target.speed, 1);
  }
}

class Minerva extends Player {
  constructor(pos, speed) {
    super(pos, 0, speed, "#698db6", "Minerva");
    this.hasAB = true; this.ab1L = 5; this.ab2L = 0; this.firstTotalCooldown = 8000; this.secondTotalCooldown = 8000;
    this.judgementDuration = 5000;
  }
  abilities(time, area, offset) {
    if (this.firstAbility && this.firstAbilityCooldown == 0) {
      if(this.aura && this.energy>=20){
        for (var i in area.entities) {
          for (var j in area.entities[i]) {
            var entity = area.entities[i][j];
            if (distance(entity.pos, new Vector(this.pos.x - offset.x, this.pos.y - offset.y)) < (270 / 32) + entity.radius) {
              if (!area.entities[i][j].imune) {
                area.entities[i][j].addEffect(new JudgementEffect(this.judgementDuration, this));
              }
            }
          }
        }
        this.aura = false;
        this.auraType = -1;
        this.energy -= 20;
        this.firstAbilityCooldown = this.firstTotalCooldown;
      } else {this.aura = true; this.auraType = 5;}
    }
  }
}