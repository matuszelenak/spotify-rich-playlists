import Chart from "react-apexcharts";

const BpmGraph = ({tracks}: { tracks: any }) => {
    const tempoData = tracks.map((track, index) => [index + 1, track.ourBpm || track.tempo])
    const energyData = tracks.map((track, index) => [index + 1, parseInt((track.energy * 100).toFixed(0))])

    return (
        <Chart
            options={
                {
                    dataLabels: {
                        enabled: false
                    },
                    chart: {
                        height: 300,
                        type: 'area'
                    },
                    colors: ['#FF6384', '#35A2EB', '#546E7A', '#E91E63', '#FF9800'],
                    stroke: {
                        curve: 'smooth'
                    },
                    fill: {
                        type: 'gradient',
                        gradient: {
                            opacityFrom: 0.6,
                            opacityTo: 0.8,
                        }
                    },
                }
            }
            type={"area"}
            series={
                [
                    {data: tempoData, name: 'Tempo'},
                    {data: energyData, name: 'Energy'}
                ]
            }
            height={300}
        />
    )
}

export default BpmGraph