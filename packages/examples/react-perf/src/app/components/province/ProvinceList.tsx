import {Province} from "../../rules/rules";
import {Typography} from "@mui/material";

export const ProvinceRow: React.FC<(Province & { id: string })> = ({
                                                                     provinceName,
                                                                     provinceClassification,
                                                                     provincePopulation
                                                                   }) =>
  (<div>
    <Typography variant={"h1"}>{provinceName}</Typography>
    <Typography variant={"subtitle1"}>A {provinceClassification} Province of {provincePopulation} people</Typography>
  </div>)


export const ProvinceList: React.FC<{ provinces: (Province & { id: string })[] }> = ({provinces}) => {

  return (
    <div>
      {provinces.map(p => <ProvinceRow {...p}/>)}
    </div>
  )
}
