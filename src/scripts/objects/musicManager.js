import sponsors from '../../assets/memberlist.json'
import moment from 'moment'
export default class MusicManager {
  settings
  audio
  scene
  sponsors = sponsors
  showSponsorsAt = 27.1
  endShowSponsorAt = 322
  showSponsorDuration = this.endShowSponsorAt - this.showSponsorsAt
  showSponsors = false
  endShowSponsors = false
  currentSponsers = []
  events = []
  virtualTime
  virtualTimeSeek = 0.1
  virtualTimeDurationInSeconds
  virtualTimeStartAt
  virtualTimeEndAt = moment(sponsors[sponsors.length - 1][3])
  debugMsg
  nextSponsor
  constructor (scene) {
    this.scene = scene
    const { settings } = scene.game
    this.settings = settings
    scene.pauseOnBlur = false
    this.music = scene.sound.add('music')

    this.showSponsorsAt = settings.currentMusic[1]
    this.endShowSponsorAt = settings.currentMusic[2]
    this.showSponsorDuration = this.endShowSponsorAt - this.showSponsorsAt

    if (this.settings.DEBUG) {
      this.debugMsg = scene.add.text(10, 40, '', {
        color: 'black',
        fontSize: '20px'
      })
    }
  }

  on (event, listener) {
    switch (event) {
      case 'sponsorJoin':
      case 'endShowSponsors':
        this.addEvent(event, listener)
        break
      default:
        this.music.on(event, listener)
        break
    }
  }

  addEvent (event, listener) {
    this.events.push([
      event, listener
    ])
  }

  emitEvent (event, data) {
    this.events.filter(e => {
      return e[0] === event
    }).forEach(e => {
      e[1](data)
    })
  }

  play (config) {
    var seek = 0
    // TODO
    // REMOVE in production
    seek = this.showSponsorsAt - 2
    if (this.settings.DEBUG) {
      seek = this.showSponsorsAt - 2
      // seek = this.endShowSponsorAt - 10
    }

    this.music.play({
      ...config,
      seek
    })
  }

  showFirstSponsor () {
    const s = this.sponsors.shift()
    this.showSponsors = true
    this.virtualTimeStartAt = moment(s[3])
    this.virtualTimeDurationInSeconds = this.virtualTimeEndAt.diff(this.virtualTimeStartAt, 'seconds')
    this.showSponsor(s)
    this.nextSponsor = this.sponsors.shift()
  }

  showSponsor (s) {
    this.emitEvent('sponsorJoin', s)
  }

  update (time, delta) {
    // console.log('update in music m')
    if (!this.music) return
    const seek = parseFloat(this.music.seek.toFixed(1))
    // console.log(seek, this.showSponsorsAt)
    if (seek >= this.showSponsorsAt && this.showSponsors === false) {
      this.showFirstSponsor()
    }
    var showsSeekP = (seek - this.showSponsorsAt) / this.showSponsorDuration
    if (showsSeekP >= 1.2) {
      showsSeekP = 1.2
    }
    const secsToAdd = showsSeekP * this.virtualTimeDurationInSeconds
    this.virtualTime = moment(this.virtualTimeStartAt).add(secsToAdd, 'seconds')

    if (this.nextSponsor && this.virtualTime >= moment(this.nextSponsor[3])) {
      this.showSponsor(this.nextSponsor)
      this.nextSponsor = sponsors.shift()
    }

    if (seek >= this.endShowSponsorAt + 10 && this.endShowSponsors === false) {
      this.emitEvent('endShowSponsors', {})
      this.endShowSponsors = true
    }

    if (this.settings.DEBUG) {
      try {
        var texts = [
          'seek: ' + seek.toFixed(1) + ' total:' + this.music.duration,
          'msuic_seek_p: ' + seek / this.music.duration,
          'showsSeekP: ' + (showsSeekP * 100).toFixed(2) + ' %',
          // 'secsToAdd: ' + secsToAdd,
          // 'showSponsorDuration: ' + this.showSponsorDuration,
          // 'vTimeDuration:' + this.virtualTimeDurationInSeconds,
          'vTime: ' + this.virtualTime.format(),
         `vTimeStart: ${this.virtualTimeStartAt.format()}`,
         `vTimeEnd: ${this.virtualTimeEndAt.format()}`
        ]

        texts.push('nextSponsor:' + moment(this.nextSponsor[3]).format() + ', ' + this.nextSponsor[0])
      } catch (error) {
        // console.error(error)
      }
      this.debugMsg.setText(texts)
    }
  }
}
