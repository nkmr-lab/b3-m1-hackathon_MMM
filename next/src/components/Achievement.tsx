import React, { useEffect, useState, Suspense } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '../context/AuthContext';
import { apiRoot } from "../utils/foundation";

type Spot = {
    id: number;
    name: string;
    lat: number;
    lon: number;
    is_achieved: boolean;
};

const Spots: React.FC = () => {
    const { user } = useAuth();
    const [spots, setSpots] = useState<Spot[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`${apiRoot}/spots-with-achievement?user_uid=${user?.uid ?? "guest"}`);
                if (!res.ok) {
                    throw new Error("データの取得に失敗しました");
                }
                const data = await res.json();
                setSpots(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    if (loading) return <p>読み込み中...</p>;

    return (
        <div>
            <Table>
                <TableHeader>
                    <TableRow
                        style = {{backgroundColor: 'rgba(0, 0, 0, 0.1)'}}
                    >
                        <TableCell>スポット画像</TableCell>
                        <TableCell>スポットの名称</TableCell>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {spots.map((spot, index) => {
                    const imagePath = `/icons/${spot.name}.png`;

                    return(
                        <TableRow
                            key={index} // インデックスをkeyとして使用
                            style={{ backgroundColor: spot.is_achieved ? 'rgba(0, 0, 255, 0.5)' : 'inherit' }}
                        >
                            <TableCell>
                                    <img
                                        src={imagePath}
                                        alt={spot.name}
                                        onError={(e) => e.currentTarget.src = "/icons/default.png"} // 画像がない場合はデフォルト画像を表示
                                        style={{ width: "50px", height: "50px", objectFit: "cover", borderRadius: "5px" }}
                                    />
                                </TableCell>
                            <TableCell>{spot.name}</TableCell>
                        </TableRow>
                    );
                    })}
                </TableBody>
            </Table>
        </div>
    );
};

const Achievement: React.FC = () => {
    return (
        <div>
            <Suspense fallback={<p>読み込み中...</p>}>
                <Spots />
            </Suspense>
        </div>
    );
};

export default Achievement;
