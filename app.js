const express = require('express')
const app = express()
app.use(express.json())

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const path = require('path')
const dbPath = path.join(__dirname, 'cricketMatchDetails.db')

let db = null

const initializeDatabaseAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
  }
}

initializeDatabaseAndServer()

// API 1  Method: GET

app.get('/players/', async (request, response) => {
  const getStateQuery = `SELECT * FROM player_details ORDER BY player_id;`
  const playerArray = await db.all(getStateQuery)

  const modifiedStateArray = playerArray.map(player => ({
    playerId: player.player_id,
    playerName: player.player_name,
  }))

  response.send(modifiedStateArray)
})

// API 2 Method: GET Players by Id

app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const getStateQuery = `SELECT * FROM player_details WHERE player_id = ${playerId};`
  const player = await db.get(getStateQuery)

  const formattedState = {
    playerId: player.player_id,
    playerName: player.player_name,
  }

  response.send(formattedState)
})

module.exports = app

// API 3 Method: PUT players

app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const playerDetails = request.body
  const {playerName} = playerDetails

  const updatePlayerQuery = `
      UPDATE 
        player_details
      SET 
        player_name = '${playerName}'
      WHERE
        player_id = ${playerId};`

  await db.run(updatePlayerQuery)
  response.send('Player Details Updated')
})

// API 4 Method: GET Matches by Id

app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params
  const getStateQuery = `SELECT * FROM match_details WHERE match_id = ${matchId};`
  const match = await db.get(getStateQuery)

  const formattedState = {
    matchId: match.match_id,
    match: match.match,
    year: match.year,
  }

  response.send(formattedState)
})

// API 5 Method: GET Returns a list of all the matches of a player

app.get('/players/:playerId/matches', async (request, response) => {
  const {playerId} = request.params

  const getMatchesQuery = `
      SELECT 
        md.match_id, md.match, md.year
      FROM 
        match_details md
      NATURAL JOIN 
        player_match_score pms
      WHERE 
        pms.player_id = ${playerId}
      
    `

  const matchesArray = await db.all(getMatchesQuery)
  const formattedState = matchesArray.map(data => ({
    matchId: data.match_id,
    match: data.match,
    year: data.year,
  }))

  response.send(formattedState)
})

// API 6 Method: GET Returns a list of players of a specific match

app.get('/matches/:matchId/players', async (request, response) => {
  const {matchId} = request.params

  const getPlayersQuery = `
      SELECT 
        pd.player_id, pd.player_name
      FROM 
        player_details pd
      NATURAL JOIN 
        player_match_score pms
      WHERE 
        pms.match_id = ${matchId}
     
    `

  const matchesArray = await db.all(getPlayersQuery)
  const formattedState = matchesArray.map(data => ({
    playerId: data.player_id,
    playerName: data.player_name,
  }))

  response.send(formattedState)
})

// API 7 Method: GET Returns the statistics of the total score, fours, sixes of a specific player based on the player ID

app.get('/players/:playerId/playerScores', async (request, response) => {
  const {playerId} = request.params
  const getStatistics = `
            SELECT 
              pd.player_id,
              pd.player_name,
              SUM(pms.score) AS totalScore,
              SUM(pms.fours) AS totalFours,
              SUM(pms.sixes) AS totalSixes
            FROM 
              player_details pd
            INNER JOIN 
              player_match_score pms
            ON
              pd.player_id = pms.player_id
            WHERE 
              pd.player_id = ${playerId}
            GROUP BY
              pd.player_id, pd.player_name;`

  const statsData = await db.get(getStatistics)
  const formattedData = {
    playerId: statsData.player_id,
    playerName: statsData.player_name,
    totalScore: statsData.totalScore,
    totalFours: statsData.totalFours,
    totalSixes: statsData.totalSixes,
  }

  response.json(formattedData)
})
