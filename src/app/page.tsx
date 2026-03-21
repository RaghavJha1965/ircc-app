"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RefreshCw, TrendingDown, TrendingUp, Users, Calendar, Target } from "lucide-react"

interface Draw {
  id: string
  drawNumber: number
  drawDate: string
  drawName: string
  crsScore: number
  itasIssued: number
}

interface Stats {
  averageCrs: number
  lowestCrs: number
  highestCrs: number
  totalItas: number
  drawsThisYear: number
}

interface DrawsResponse {
  draws: Draw[]
  stats: Stats
  count: number
}

export default function Dashboard() {
  const [data, setData] = useState<DrawsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchDraws = async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true)
      const url = refresh ? "/api/draws?refresh=true" : "/api/draws"
      const response = await fetch(url)
      const json = await response.json()
      setData(json)
    } catch (error) {
      console.error("Error fetching draws:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchDraws()
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-CA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const latestDraw = data?.draws?.[0]
  const previousDraw = data?.draws?.[1]
  const crsTrend = latestDraw && previousDraw ? latestDraw.crsScore - previousDraw.crsScore : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Express Entry Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Track CRS scores and Express Entry draws in real-time
          </p>
        </div>
        <Button
          onClick={() => fetchDraws(true)}
          disabled={refreshing}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing..." : "Refresh Data"}
        </Button>
      </div>

      {/* Latest Draw Card */}
      {latestDraw && (
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardDescription>Latest Express Entry Draw</CardDescription>
                <CardTitle className="text-4xl mt-2">
                  CRS {latestDraw.crsScore}
                  {crsTrend !== 0 && (
                    <span className={`text-lg ml-3 ${crsTrend > 0 ? "text-red-500" : "text-green-500"}`}>
                      {crsTrend > 0 ? (
                        <TrendingUp className="inline h-5 w-5" />
                      ) : (
                        <TrendingDown className="inline h-5 w-5" />
                      )}
                      {Math.abs(crsTrend)} from previous
                    </span>
                  )}
                </CardTitle>
              </div>
              <Badge variant="secondary" className="text-lg px-4 py-1">
                Draw #{latestDraw.drawNumber}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-semibold">{formatDate(latestDraw.drawDate)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">ITAs Issued</p>
                  <p className="font-semibold">{latestDraw.itasIssued.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Target className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Program</p>
                  <p className="font-semibold">{latestDraw.drawName}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      {data?.stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Average CRS</CardDescription>
              <CardTitle className="text-2xl">{data.stats.averageCrs}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Lowest CRS</CardDescription>
              <CardTitle className="text-2xl text-green-600">{data.stats.lowestCrs}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Highest CRS</CardDescription>
              <CardTitle className="text-2xl text-red-500">{data.stats.highestCrs}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Draws This Year</CardDescription>
              <CardTitle className="text-2xl">{data.stats.drawsThisYear}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Draw History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Express Entry Draws</CardTitle>
          <CardDescription>
            History of the last {data?.count || 0} draws
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Draw #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Program</TableHead>
                <TableHead className="text-right">CRS Score</TableHead>
                <TableHead className="text-right">ITAs</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.draws?.map((draw, index) => (
                <TableRow key={draw.id}>
                  <TableCell className="font-medium">#{draw.drawNumber}</TableCell>
                  <TableCell>{formatDate(draw.drawDate)}</TableCell>
                  <TableCell>
                    <Badge variant={draw.drawName === "No program specified" ? "secondary" : "outline"}>
                      {draw.drawName}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={`font-semibold ${index === 0 ? "text-primary" : ""}`}>
                      {draw.crsScore}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">{draw.itasIssued.toLocaleString()}</TableCell>
                </TableRow>
              ))}
              {(!data?.draws || data.draws.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No draws found. Click &quot;Refresh Data&quot; to fetch the latest draws.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
