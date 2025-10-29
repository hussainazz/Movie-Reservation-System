import Movie from "../models/movieModel.js";
import Movies from "../models/movieModel.js";
import AppError from "../utils/appError.js";
import { retrieveShowTimes } from "../controllers/showTimeController.js"

export async function findMovie(movie_id, showTime_id) {
    const movie = await Movie.findOne({ where: { movie_id } });
    if (movie === null) {
        throw new AppError("No movie with this id exists", 404);
    }
    return movie;
}

async function retrieveMovies(req, res, next) {
    const showTimesFilter = req.url.split("/")[2]
    if(showTimesFilter) {
        const showTimes = await retrieveShowTimes(req, res, next)
        return res.status(200).json({
            showTimes,
        });
    }
    if (req.params.movieId && !showTimesFilter) {
        let movie = findMovie(req.query.id);
        return res.json(movie);
    }
    let movies = await Movies.findAll();
    res.json(movies);
}

async function addMovie(req, res, next) {
    const title = req.body.title;

    const movie = await Movies.create({ title });

    res.status(201).json({
        status: "ok",
        id: movie.movie_id,
        msg: "movie added successfully.",
    });
}

async function deleteMovie(req, res, next) {
    let movie = await findMovie(req.body.movie_id);
    await movie.destroy();
    res.json(`movie ${movie.movie_id} deleted`);
}

export { retrieveMovies, addMovie, deleteMovie };
