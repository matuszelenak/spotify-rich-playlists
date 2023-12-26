import {Line} from "react-chartjs-2";
import {CategoryScale, Chart as ChartJS, Legend, LinearScale, LineElement, PointElement, Title, Tooltip} from 'chart.js';

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

const BpmGraph = ({tracks}: {tracks: any}) => {
    const bpmData = {
        labels: tracks.map((track: any) => track.index),
        datasets: [
            {
                label: 'BPM',
                // @ts-ignore
                data: tracks.map((track) => track.ourBpm || 0),
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
            },
            {
                label: 'Energy',
                // @ts-ignore
                data: tracks.map((track) => track.energy * 100),
                borderColor: 'rgb(53, 162, 235)',
                backgroundColor: 'rgba(53, 162, 235, 0.5)',
            }
        ]
    }

    return (
        <Line options={options} data={bpmData} height={45}/>
    )
}

export default BpmGraph