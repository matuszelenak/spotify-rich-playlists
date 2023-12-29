import {CategoryScale, Chart as ChartJS, Legend, LinearScale, LineElement, PointElement, Title, Tooltip} from 'chart.js';
import Chart from "react-apexcharts";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const options = {
    responsive: true,
    plugins: {
        legend: {
            position: 'top' as const,
        }
    },
};

const BpmGraph = ({tracks}: { tracks: any }) => {
    const tempoData = tracks.map((track) => [track.index, track.ourBpm || track.tempo])
    const energyData = tracks.map((track) => [track.index, parseInt((track.energy * 100).toFixed(0))])

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